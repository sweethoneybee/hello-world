## S3 Policy 설정

이제는 S3 Policy에 쪼끔은 익숙해진 듯 하다.

- Bucket 소유자라고 해서 반드시 Object 소유자인 것은 아니다.
- 오브젝트마다 권한 설정을 다르게 해줄 수 있다.
- Public 체크해서 열어두는 것은 무조건 다 막을 필요는 없고, bucket policy 작성한 것에 따라  
  다르게 체크를 해제해주어야 한다. 우리 서버의 경우 이미지 업로드를 위해 1번째 것만 풀어둠.
- 이제 스프링 서버에게는 S3 Full Access가 가능한 IAM의 키를 주어서 접근할 수 있게 해두었다.  
  그리고 bucket policy에 get, put 권한을 줘서 이미지 업로드 가능하게 했다.
- 이제 S3에 public으로 직접 접근할 수 없다. 반드시 CloudFront를 통해서만 접근 할 수 있다.  
  이렇게 함으로써 S3에 데이터 전송량을 줄일 수 있고(비용이 절감된다는 의미) 부하를 덜 수 있다.

## 웹소켓서버 예외처리

전에 짜둔 코드들을 바탕으로 서버가 죽지 않게 예외처리를 해주었다.  
리팩토링이라고 하긴 뭐하지만 약간의 리팩토링과 예외처리를 했다.
코드를 나누는 것에 집중하다보니 너무 잘게 쪼개었고 오히려 중복되는 코드들이 많았었다.  
우선은... 기능 구현만 해보자.. 빨리 수정해야하는데..  
