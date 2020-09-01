[아마존 블로그](https://aws.amazon.com/ko/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/)에서 필요한 부분을 골라서 번역한 글

**Amazon CloudFront distribution에 람다 함수를 실행하기 위해 4개까지 trigger를 구성할 수 있다. 구성할 수 있는 CloudFront의 이벤트들은 다음과 같다.**

CloudFront Viewer Request - CF가 요청을 viewer로부터 받았을 때, 그리고 requested object가 edge cache에 있는지 없는지 확인하기 전 함수 실행.  
CloudFront Origin Request - 오직 CF가 내 origin server에 request를 보낼때 함수 실행. requested object가 edge cache에 있다면 함수는 실행되지 않음.  
CloudFront Origin Response - origin server로 부터 CF가 response를 받은 후, 그리고 response 안에 object를 캐시하기 전 함수 실행.  
CloudFront Viewer Response - viewer에게 requested object를 return하기 전에 함수 실행. 함수는 edge cache에 이미 object가 있든 없든 상관없이 실행된다.

**예제 진행을 위해 아래 4가지를 가정함.**

1. 쿼리 인자로 넘겨받은 크기로 이미지를 리사이즈 한다
2. viewer의 특징에 맞추어 적절한 이미지 포맷을 제공한다. 예를 들어 크롬/안드로이드 브라우저를 위한 WebP, 혹은 다른 브라우저를 위한 JPEG.
3. 이미지 크기의 whitelist를 정의하고 허용해서 생성되고 제공되게 한다.
4. 오직 요청된 이미지사이즈/포맷이 존재하지 않을 때만 리사이즈 연산을 수행한다.

사용자는 뭄바이에 있고 서버는 us-east-1에 있다고 가정.  
이미지 url은 아래와 같다고 가정.  
https://static.mydomain.com/images/image.jpg?d=100×100   
원본 이미지는 '/images' 경로에서 나타나고, 쿼리 인자 'd'가 요구되는 이미지 사이즈를 나타낸다(width x height)

￼
**현재 상황**

1. 두 개의 Lambda@Edge trigger는 각각 CloudFront distribution과 연관이 있는 Viewer-Request, Origin-Response이다.
2. Origin server는 S3이다.

**위 아키텍처에 있는 5가지 스텝을 적음**  
Step1: requested image url은 적절한 사이즈와 포맷을 제공하기 위해 Lambda@Edge 함수에서 조정된다. request가 cache hit을 확인하기 전에 일어난다.  
Step2: CloudFront가 origin server로 부터 object를 fetch한다.  
Step3: 만약 요구된 이미지가 이미 bucket에 있거나 혹은 생성되고 저장된 경우(step 5를 통해), CloudFront는 viewer에게 object를 반환한다. 이 단계에서 이미지가 캐싱된다.  
Step4: cache에 있는 object가 유저에게 반환된다.  
Step5: 이미지가 origin에 없을 때만 resize operation이 수행된다. 원본이미지를 fetch하고 리사이즈하기 위해 network call이 S3 bucket(origin)에 생긴다. 리사이즈된 이미지는 CloudFront에 보내지기 전에 persisted back 된다.

참고: Step 2,3,5는 object가 존재하지 않거나 cache에 없을 때만 실행된다. 이미지와 같은 static resource는 cache-hit ratios를 향상 시키기 위해 가능한 긴 Time to Live(TTL)을 가져야 한다.

## Lambda@Edge Functions 파헤치기

- Viewer-Request Function
  _Code snippet 1 - 요청 uri 수정하기_

```
'use strict';

const querystring = require('querystring');

// defines the allowed dimensions, default dimensions and how much variance from allowed
// dimension is allowed.

const variables = {
        allowedDimension : [ {w:100,h:100}, {w:200,h:200}, {w:300,h:300}, {w:400,h:400} ],
        defaultDimension : {w:200,h:200},
        variance: 20,
        webpExtension: 'webp'
  };

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // parse the querystrings key-value pairs. In our case it would be d=100x100
    const params = querystring.parse(request.querystring);

    // fetch the uri of original image
    let fwdUri = request.uri;

    // if there is no dimension attribute, just pass the request
    if(!params.d){
        callback(null, request);
        return;
    }
    // read the dimension parameter value = width x height and split it by 'x'
    const dimensionMatch = params.d.split("x");

    // set the width and height parameters
    let width = dimensionMatch[0];
    let height = dimensionMatch[1];

    // parse the prefix, image name and extension from the uri.
    // In our case /images/image.jpg

    const match = fwdUri.match(/(.*)\/(.*)\.(.*)/);

    let prefix = match[1];
    let imageName = match[2];
    let extension = match[3];

    // define variable to be set to true if requested dimension is allowed.
    let matchFound = false;

    // calculate the acceptable variance. If image dimension is 105 and is within acceptable
    // range, then in our case, the dimension would be corrected to 100.
    let variancePercent = (variables.variance/100);

    for (let dimension of variables.allowedDimension) {
        let minWidth = dimension.w - (dimension.w * variancePercent);
        let maxWidth = dimension.w + (dimension.w * variancePercent);
        if(width >= minWidth && width <= maxWidth){
            width = dimension.w;
            height = dimension.h;
            matchFound = true;
            break;
        }
    }
    // if no match is found from allowed dimension with variance then set to default
    //dimensions.
    if(!matchFound){
        width = variables.defaultDimension.w;
        height = variables.defaultDimension.h;
    }

    // read the accept header to determine if webP is supported.
    let accept = headers['accept']?headers['accept'][0].value:"";

    let url = [];
    // build the new uri to be forwarded upstream
    url.push(prefix);
    url.push(width+"x"+height);

    // check support for webp
    if (accept.includes(variables.webpExtension)) {
        url.push(variables.webpExtension);
    }
    else{
        url.push(extension);
    }
    url.push(imageName+"."+extension);

    fwdUri = url.join("/");

    // final modified url is of format /images/200x200/webp/image.jpg
    request.uri = fwdUri;
    callback(null, request);
};
```

코드는 viewer의 'Accept'헤더에 맞춰 다른 이미지 포맷을 제공하기 위해 URI를 조정한다.  
또한 요청된 사이즈를 사이즈 whitelist에 비교해서 체크하고 가장 가까운 사이즈에 맞춘다(없으면 default로 함).  
그래서 요청이 105wx100h와 같이 표준이 아니더라도 100wx100h로 제공해줄 수 있다.  
이 방식으로 생성되고 캐싱되는 이미지의 사이즈를 더 컨트롤할 수 있고 또한 캐시 히트 비율도 높아진다(낮은 레이턴시가 되겠죵?).  
또한 불필요한 크기의 이미지를 생성하려고 하는 악의적인 유저도 방지할 수 있다.

예를 들어, 아래와 같은 URI를 받았다고 가정해보자.  
`pathPrefix/image-name?d=widthxheight`  
이건 아래처럼 변할 것이다.  
`pathPrefix/widthxheight/<requiredFormat>/image-name`  
requiredFormat은 request의 'Accept' 헤더에 따라 webp/jpg로 바뀐다.

- Origin-Response Function  
  _Code snippet 2 - 필요한지 확인하고 resize 트리거를 발동시키기_

```
'use strict';

const http = require('http');
const https = require('https');
const querystring = require('querystring');

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

// set the S3 and API GW endpoints
const BUCKET = 'image-resize-${AWS::AccountId}-us-east-1';

exports.handler = (event, context, callback) => {
  let response = event.Records[0].cf.response;

  console.log("Response status code :%s", response.status);

  //check if image is not present
  if (response.status == 404) {

    let request = event.Records[0].cf.request;
    let params = querystring.parse(request.querystring);

    // if there is no dimension attribute, just pass the response
    if (!params.d) {
      callback(null, response);
      return;
    }

    // read the dimension parameter value = width x height and split it by 'x'
    let dimensionMatch = params.d.split("x");

    // read the required path. Ex: uri /images/100x100/webp/image.jpg
    let path = request.uri;

    // read the S3 key from the path variable.
    // Ex: path variable /images/100x100/webp/image.jpg
    let key = path.substring(1);

    // parse the prefix, width, height and image name
    // Ex: key=images/200x200/webp/image.jpg
    let prefix, originalKey, match, width, height, requiredFormat, imageName;
    let startIndex;

    try {
      match = key.match(/(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
      prefix = match[1];
      width = parseInt(match[2], 10);
      height = parseInt(match[3], 10);

      // correction for jpg required for 'Sharp'
      requiredFormat = match[4] == "jpg" ? "jpeg" : match[4];
      imageName = match[5];
      originalKey = prefix + "/" + imageName;
    }
    catch (err) {
      // no prefix exist for image..
      console.log("no prefix present..");
      match = key.match(/(\d+)x(\d+)\/(.*)\/(.*)/);
      width = parseInt(match[1], 10);
      height = parseInt(match[2], 10);

      // correction for jpg required for 'Sharp'
      requiredFormat = match[3] == "jpg" ? "jpeg" : match[3];
      imageName = match[4];
      originalKey = imageName;
    }

    // get the source image file
    S3.getObject({ Bucket: BUCKET, Key: originalKey }).promise()
      // perform the resize operation
      .then(data => Sharp(data.Body)
        .resize(width, height)
        .toFormat(requiredFormat)
        .toBuffer()
      )
      .then(buffer => {
        // save the resized object to S3 bucket with appropriate object key.
        S3.putObject({
            Body: buffer,
            Bucket: BUCKET,
            ContentType: 'image/' + requiredFormat,
            CacheControl: 'max-age=31536000',
            Key: key,
            StorageClass: 'STANDARD'
        }).promise()
        // even if there is exception in saving the object we send back the generated
        // image back to viewer below
        .catch(() => { console.log("Exception while writing resized image to bucket")});

        // generate a binary response with resized image
        response.status = 200;
        response.body = buffer.toString('base64');
        response.bodyEncoding = 'base64';
        response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/' + requiredFormat }];
        callback(null, response);
      })
    .catch( err => {
      console.log("Exception while reading source image :%j",err);
    });
  } // end of if block checking response statusCode
  else {
    // allow the response to pass through
    callback(null, response);
  }
};
```

CloudFront가 origin server로부터 response를 받았을 때, 그리고 cache 히트가 나기 전에 함수는 호출된다.  
이 함수의 단계는 다음과 같다.

1. origin response code를 통해 S3 bucket에 object가 있는지 확인한다.
2. 만약 object가 있다면 CloudFront response cycle을 진행시킨다.
3. 만약 object가 S3 bucket에 존재하지 않는다면, 소스 이미지를 버퍼로 fetch하고, 리사이징을 하고 S3 bucket에 알맞은 prefix와 메타데이터와 함께 저장한다.
4. 만약 이미지가 리사이즈되었으면, 메모리에 올라와있는 리사이즈된 이미지를 사용해 binary response가 생성되고 적절한 status code와 헤더와 함께 보내진다.  
   (S3와 Lambda 함수의 region이 다르면 요금이 다르게 나올 수 있으니 참고할 것)

### Step by Step Setup

블로그에는 dockerfile을 이용해서 람다함수 환경을 구성하였음.  
이후 S3 policy를 구성하고 CloudFront를 설정하면서 Lambda@Edge 함수 트리거를 설정함.  
최종 결과물은 아래와 같은 형식의 uri로 요청했을 때 리사이징 이미지가 잘 나오는 것.  
`https://{cloudfront-domain}/images/image.jpg?d=100x100`

## 참고글

[아마존 블로그](https://aws.amazon.com/ko/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/)  
[Lambda@Edge event 구조](https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html)  
[당근마켓 블로그](https://medium.com/daangn/lambda-edge%EB%A1%9C-%EA%B5%AC%ED%98%84%ED%95%98%EB%8A%94-on-the-fly-%EC%9D%B4%EB%AF%B8%EC%A7%80-%EB%A6%AC%EC%82%AC%EC%9D%B4%EC%A7%95-f4e5052d49f3)  
[CloudFront 트리거 추가](https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-how-it-works-tutorial.html)
