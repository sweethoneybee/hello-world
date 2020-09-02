## 403 error

람다엣지를 배포하긴 했는데 계속해서 403 error가 떴다.  
403은 Forbidden 이라서 CloudFront, 람다엣지, S3 중 한 곳 이상에서 권한설정이  
문제가 된다고 판단했다. 사실은 다 문제있었지...

- CloudFront 설정  
  Origin Access Identity(OAI)를 Origin과 연계해서 설정해주었다.  
  그리고 특별히 query string whitelist도 내가 사용할 'd'만 등록해두었다.  
  또 캐시 TTL의 허용 범위를 최대로 늘려놓아서 cache hit ratio를 늘리도록 했다.  
  (당연히 Origin Response 람다 엣지에서 캐시생존시간을 최대로 설정해줘야함)

- 람다엣지 설정  
  람다 엣지는 IAM의 Role을 추가했다. Permission에는 S3FullAccess를 주었고  
  (S3에 직접 접근하고 있으니 줌)  
  LambdaBasicExecutionRole(자동추가된 듯)을 주었다.  
  Truest Relationship은 검색할 때 많이 나오는 대로 아래와 같이 설정했다.  
  어떤 의미를 갖는지는 더 공부가 필요하다.

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "edgelambda.amazonaws.com",
          "lambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

- S3 설정  
  S3의 Bucket Policy가 403 에러의 결정적인 원인이었던 것 같다.  
  CloudFront, 람다엣지 설정을 다 해주어도 계속해서 403에러가 뜨다보니 에라모르겠다  
  하고 ACL의 everyone에게 모든 권한을 다 주니 이미지 리사이징이 되기 시작했다.  
  그래서 여러 번 실험해본 결과, List 권한을 주는 것이 핵심이라는 것을 알아냈다.  
  냉정을 되찾아서 다시 권한을 원상태로 돌리고, Bucket Policy로 OAI를 설정해둔 CloudFront에게  
  "s3:ListBucket" 권한을 주었다. 이때 resource는 object가 아니라 bucket이어야 한다.

## CloudFormation

cloudformation은 코드로 aws 클라우드 환경을 만들 수 있게 해주는 서비스이다.  
코드라고 해도 사실은 yaml파일로 형식에 맞게 이쁘게 잘 적으면 S3로 생성하고 람다도 만들고  
Role도 만들고 등등 사실상 모든 설정을 이걸로 할 수 있다.  
기존 aws console의 gui환경에서 마우스 딸깍거리며 설정하던 것을 이제 코드로 관리할 수 있는 것이다.  
클라우드 환경도 동일하게 배포할 수 있게 해주고, 구성 중에 특정 오류가 생기면 진행하던 사항을  
롤백하는 기능도 있다. 예를 들어 S3 생성에 실패한 경우 만들어둔 람다를 지운다든지 등.
