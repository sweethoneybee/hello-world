## S3

모든 퍼블릭 액세스 차단하더라도 람다에는 문제가 없음.  
왜냐하면 버킷 정책(json으로 작성됨)으로 허용을 했기 때문.  
코드는 다음과 같음.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AddPerm",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::momelet/*"
        }
    ]
}
```

s3:GetObject, s3:PutObject를 통해서 다운받고 업로드하는 것을 허용한 것.

## Lambda

이미지 리사이징은 sharp를 사용하였음.
내가 직접 코드를 짠 것도 있지만 aws의 샘플 코드가 잘 나와있어서 그것으로 대체하였음.  
(https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/with-s3-example-deployment-pkg.html)  
람다 런타임에는 nodejs에 이미 aws-sdk 가 있어서 라이브러리를 따로 설치하지 않아도 됨.  
그래서 sharp만 설치하고 zip파일로 람다에 업로드 하였음.  
그리고 S3트리거에 접두사를 잘 붙여줘서(특정 폴더에 이미지가 업로드될 때만 트리거) 람다를 호출함.  
과정은 아래와 같음.  
**S3특정폴더에 업로드 -> 트리거 -> 람다호출 -> 람다에서 이미지 다운로드 -> sharp를 이용해 이미지 리사이징**  
**-> 리사이징된 이미지 S3에 업로드 -> 완료**

**트러블슈팅**

1. 람다에 업로드하는 zip파일의 파일구조  
   -> zip을 까면 바로 handler 함수가 들어있는 소스코드가 있어야한다. 상위폴더로 말아버리면 안됨.  
   그리고 람다의 handler이름은 "파일이름.함수명"으로 설정해줘야 한다(aws console에서 하는 것)  
   람다에서 호출하려는 함수를 exports한 파일이름과, exports한 함수명을 적는 것!  
   node js 이슈이긴 한데, module.exports 등과 같이 하면 안됨.  
   `exports.함수이름 = (함수)=>{}` 로 할 것.

2. Sharp를 리눅스 버전으로 npm install 해야 하는 문제  
   -> mac os에서 npm install sharp를 하면 아키텍처가 달라서 람다에서 오류가 난다.  
   그래서 EC2에서 npm install 하고 가져오는 식으로 무식하게 했는데, 옵션을 줌으로써 해결.  
   `$ npm install --arch=x64 --platform=linux --target=12.13.0 sharp`

3. cloudwatch가 무료 버전이라 디버깅하는 데에 오래 걸림  
   -> 어느 샌가 바로바로 업데이트 되긴 했는데 원인을 잘 모르겠음.  
   근데 cloudwatch에서도 console.log로 찍힌 게 나오니깐 개발 중엔 로그 부지런히 찍자.

## 이제 해야할 것

1. S3, 람다 비용 정리
2. 추정 전체 식당 이미지 크기
3. 1, 2에 따라 프로필이미지, 식당이미지가 각각 온디맨드방식이 좋을지 on-the-fly방식이 좋을지 고민해보자(요금 위주로)
4. 프론트엔드와 공조해서 이미지 사이즈를 조절하여 맞출 것.
5. CDN과 S3의 연계
