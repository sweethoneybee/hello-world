## jwt

스프링 서버에서 넘어온 jwt를 내가 시크릿키로 풀어보면 자꾸 invalid signiture오류가 났다.  
계속 오류를 찾다가 스프링 서버의 코드도 찾아봤는데 아래 두 개의 메소드가 인자로 base64EncodedSecretKey를 String으로 받고 있는 것을 발견했다.

```
Jwts.builder().signWith()
Jwts.parser().setSigningKey()
```

그런데 현재 우리가 구현한 코드는 시크릿키를 base64로 인코딩하지 않고 넘겨주고 있었고 그래서 웹소켓서버에서 자꾸 유효하지 않은 시그니처 오류가 난 것이다.  
base64로 인코딩, 디코딩 했을 때 하나의 쌍은 있으나, 인코딩 하지 않은 문자를 디코딩했을 경우 쌍을 이루지 못한다.  
따라서 스프링에서 Jwt를 만들 때는 꼭 시크릿키를 base64로 인코딩하고 보내라.  
base64인코딩 메소드는 스프링에서 지원한다. `Base64Utils.encodeToString()` (static 메소드로 지원한다).

## js 예외처리

자바스크립트로 예외를 처리하기 위해서 커스텀 Error를 만들었다. Error 클래스를 상속받아 새로운 클래스를 만드는 형식이다.  
Error 클래스는 message, fileName, lineNumber 이렇게 3개의 인자를 받는데 전부 optional이라 new 연산자로 객체를 생성할 때 넘기지 않아도 된다.  
그리고 catch 문에서는 `if (e instance of CusttomError)` 로 에러를 구분해서 잡는다. 자바와 다르게 catch의 인자로 에러 하나만 받고  
이후 catch 내부에서 if문으로 에러를 구분한다.

### 구축한 코드

메세지, 에러코드는 에러를 생성할 때 수정할 수 있도록 디폴트 파라미터로 받았다.

```
class UndefinedTypeError extends Error {
  constructor(message = "UndefinedTypeError", errorCode = 100, ...params) {
    super(...params);
    this.message = message;
    this.errorCode = errorCode;
  }
}

```

## 타입스크립트의 필요성

Nodejs 웹소켓 서버의 예외처리 작업을 시작하고나서 타입스크립트가 너무나도 마렵다.  
인자로 받은 것이 undefined인지, number인지, string인지 일일이 타입체크를 해야하니 번거롭다.  
100%로 체크하려면 소켓에서 메시지를 받을 때마다 undefined, 알맞은 타입인지를 체크해야 한다.  
이러면 코드의 가독성이 떨어지고, Repeat myself와 다를 게 없다. 또한 내가 어디서 실수를 하게 되면 더 걷잡을 수 없게 되고  
프로젝트가 더 커져서 여러 사람이 달라붙으면 이제 더더더 문제가 커지고, 타입체크하는 데에 코드를 낭비하게 되고, 시간도 쓰게 된다.

> 아릅답지 못하다.

우선은 급한대로 인자의 타입체크만을 하는 메소드를 만들어서 타입체크를 하고 있다.
100%의 타입체크는 못하겠지만, 적어도 우리 프로젝트 내에서 정의한 소켓 간 잘못된 메시지는 거를 수 있다.  
소켓 간 메시지에서 number, string, Array 타입만 쓰이기에 3타입만 검사하도록 했다.

```
export default (typeCheckObject) => {
  let types = Object.keys(typeCheckObject);

  types.forEach((type) => {
    let values = typeCheckObject[type];

    values.forEach((value) => {
      if (value === undefined)
        throw new UndefinedTypeError(100, "UndefinedTypeError");
      if (typeof value !== type && type !== "Array")
        throw new WrongTypeError(101, "WrongTypeError");
    });
  });
};
```

인자로 받는 typeCheckObject는 객체이며, key로는 체크하고 싶은 타입명, value로는 체크하고자 하는 객체들을 배열안에 넣는다.  
아래는 예시이다.

```
let typeCheckObject = {
  number: [1, 2, 3, 4],
  Array: [3, "hi", 1],
  string: ["hi", "bye"],
};
```

다만 이 경우, Array를 체크할 수 없다. 배열은 Object 취급을 받기 때문에 typeof Array 는 object가 나온다.  
배열을 또 배열로 감싸는 방식으로 배열을 구분할 수는 있겠으나, 정의한 메시지 특징 상 거기까지 체크할 필요가 없어서  
Array가 key인 경우 undefined만 검사한다.

### 그런데... 방법이 너무 구린데?

인정할 건 인정해야 한다. 타입체크용으로 메소드를 정의하였으나 100%가 아니고, 우아하지 못했다.  
그나마 우리가 정의한 소켓 간 메시지 안에서만 유효하다고 위로할 수 있을 뿐...  
내가 경험해보지 못한 환상의 타입스크립트에서는 모든 객체들의 타입을 명시해야 하기에 이런 문제가 없을까?  
타입스크립트, 타입스크립트 이름만 들어보았지 실제로 들여다본적이 없기에 어떤 점에서 다른지 정확하게 모른다.  
지금 생각하는 건, C++, JAVA처럼 변수 선언 시 타입을 명시해야하지 않을까 생각중이다.  
JS... 처음에나 타입 없어서 신기하고 편했지 지금은 불편해서 타입스크립트가 너무 절실하다.

### 그래서 타입스크립트로 옮긴다고?

타입스크립트로 프로젝트를 옮기기에는 시간이 부족하다. 출시까지 얼마 남지 않았기 때문.  
PM으로서 안그래도 일정관리를 제대로 못하고 있는데 더 시간을 쓸 수가 없다.  
다만 이번 소마 프로젝트가 끝나기 전에는 타입스크립트로 포팅해도.. 괜찮을지도?

## 클린코드

클린코드 책을 읽고 있다. 아직은 의미 있는 이름 부분밖에 읽지 못했지만 프로젝트를 진행하면서 열심히 반영하려 노력 중이다.  
특히 이름을 지을 때 전보다 시간을 훨씬 많이 쏟고 있다. 다만 여전히 좋은 이름이 무엇인지, 잘 짓기는 어렵다.  
지금 그나마 적용하고 있는 건, 이름에서 의도를 정확하게 밝히려 노력하고 있는 것이다.  
추가로 이름 부분은 아니지만, 코드를 다시 읽을 때마다 정말로 다시 보게 될 때마다 조금씩 더 좋게 수정하고 있다.  
한 달 전을 생각하면 부끄러울 정도로 코드가 엉망진창이었는데, 여기서 또 한달 지나면 부끄러워 더이상 키도르르 못 칠지도...
