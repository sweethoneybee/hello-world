# UnhandledPromiseRejectionWarning 문제(async,await의 예외처리)

웹소켓 서버를 리팩토링하면서 Error 클래스를 만들고 예외처리를 한 곳에서(`errorHandler`) 하도록 하고 있던 중  
async 함수의 예외처리 중 자꾸 `UnhandledPromiseRejectionWarning`이 나타났다.  
원인은 async 함수에서 예외를 던졌을 때 이를 catch하는 곳이 없어 나타난 것이었다.  
그런데 나는 분명히 try, catch문으로 감싸고 있었는데 자꾸 이런 에러가 나타났었다.

## 왜 catch하는 곳이 없다고 하지?

우선 내가 작성했던 함수는 아래와 같다.

### errorHandler

```
const errorHandler = (callback) => {
  try {
    return callback();
  } catch(e) {
    ...
  }
}
```

콜백함수를 인자로 받는 이 함수는 `errorHandler`로서 모든 에러를 한 곳에서 처리하기 위해 만든 함수이다.

> 함수를 받는 에러 핸들러를 구현한 이유는, 웹소켓은 listen하고 있는 채널에 msg가 왔을 때 함수가 호출되고 그 순간에 예외처리를 해주어야 예외처리가 가능하기 때문이다.  
> 그냥 다 미리 try로 감싼다고 예외처리가 되지 않는다. 그래서 예외처리가 필요한 부분이 호출되는 되는 순간, 해당 함수의 내부를 무기명 함수로 감싸서 에러 핸들러에 인자로 넘기고 에러 처리를 해주었다.

그런데 `callback()` 이 async 함수인 경우가 생겼다. 한 곳에서 처리하려다 보니 async 함수인데 똑같이 코드가 적용되었고 자꾸 PromiseReject 난 것을 catch하지 못한 것이었다.

## async 함수는 프로미스만 내뱉는 것이에요!!

그렇다. async가 붙은 함수는 프로미스를 반환하지만 나는 제대로 공부하지 않아서 이를 몰랐고 그냥 기계적으로 "await 함수니깐 async만 계속 짝지어서 붙여주면 되겠지?" 라고 생각한 것이다.  
PromiseReject를 자꾸 못잡아주니 나는 기계적으로 async, await을 붙여주었고 이제는 프로미스를 반환하지 않는 곳에서 에러를 뿜기 시작했다.  
당연히 멀쩡한 함수에다 async를 붙이고 프로미스를 반환하게 했다고 오류가 생긴 것은 아니고, 이 에러핸들러를 사용하는 다른 모든 곳에 await 처리르 해주지 않아서 생긴 에러였다.  
비동기 처리를 할 필요가 없는데 비동기 처리르 한다? 오우 논블로킹손실온다;;

## 그래서 어떻게 해결했나?

머리를 데굴데굴 굴려본 결과 Nodejs 답게 async 전용 에러 핸들러를 만들기로 결심했다.  
Nodejs의 공식 doc을 보면 여러 함수들의 설명이 적혀있는데, 이 중 `file system`를 읽다보면 동기화 처리된 함수는 뒤에 꼬리로 `Sync`가 붙어있는 걸 자주 볼 수 있다.  
그래서 나는 꼬리로 `Async`를 붙인 에러핸들러인 `errorHandlerAsync(callback)` 메소드를 만들었다.  
async가 붙어서 프로미스를 반환하고 async 함수의 에러를 catch하기 위해 기다리는(await이라 그냥 기다린다고 표현해보았다) 부분이 추가되어서 다음과 같이 변경되었다.

### errorHandlerAsync

```
const errorHandlerAsync = async (callback) => {
  try{
    return await callback();
  } catch(e) {
    ...
  }
}
```

## 문제는 해결되었지만 아쉬운점...

프로미스 전용 에러 핸들러 메소드를 만들어서 필요한 곳에서만 쏙쏙 골라쓰게 하고 문제를 해결했지만 여전히 남는 문제는 있었다.  
기존 에러 핸들러의 로직을 그대로 복사해서 사용하기에 코드가 우아하지 못하고, 반복된다는 점이다.  
비동기처리에 필요한 로직만 작성하기에는 특정 상황에만 사용할 수 있을 것 같아서 같은 로직을 반복해서 작성하였지만 조금 아쉬운 부분이었다.

## 반성의 시간

async, await, promise의 개념을 잘 모른 상태로 무작정 쓰다보니 이런 문제가 발생했다고 생각한다.
그래서 Promise를 짧게 정리했다.

# Promise 정리

```
new Promise((resolve, reject) => {
  resolve(100);
  reject(new Error("난 발생하지 않는 에러야!"));
})
.then((data) => {
    let next_data = data + 200;
    return next_data;
})
.then((data) => {
  console.log(data); // 300
})
.catch((err)=>{
  console.log(err); // 에러는 없어서 안 잡히긴 함.
})
```

Promise는 3가지 상태가 있다.

1. Pending: 아직 프로미스가 처리되지 않은 상태. 비동기 처리 로직이 완료되지 않았음.
2. Fulfilled(resolved): 프로미스가 해소되어 결과값을 반환해준 상태. 비동기 처리 완료.
3. Rejected: Error가 발생함. 비동기 처리 실패.

### Pending

`new Promise()` 를 호출하면 Pending 상태가 된다. 그리고 이 상태에서는 콜백함수를 선언할 수 있고, 인자로 `resolve`, `reject`를 줄 수 있다.

```
new Promise( (resolve, reject) => { ... } )
```

### Fulfilled

이 콜백함수에서 resolve를 호출하면 Fulfilled상태가 된다. 그리고 resolved 된 상태에서는 `then()`을 호출해서 결과값을 받고 이어나갈 수 있다(그 이유는 `then()`이 프로미스를 반환하기 때문).

```
new Promise( (resolve) => {
  resolve(100);
})
.then((data) => {
  console.log(data); // 100
})
```

이 `then()` 은 무한정 이어나갈 수 있다. 자바스크립트의 설계 상 실수 중 하나이다.

### Rejected

콜백함수에서 reject를 호출하면(두 번째 인자) 에러를 던지는데, 이것을 catch로 받아주어야 한다.

```
new Promise( (resolve, reject) => {
  reject(new Error("나는 에러다!"));
})
.then(() => {
  console.log("나는 출력되지 않아. Fulfilled되지 않았거든");
})
.catch((err) => {
  console.log("내가 바로 출력되지!");
  console.log(err);
})
```

rejected된 시점에서 바로 catch로 넘어가기에, 중간에 있는 `then()`은 호출되지 않은 것이다.

### Promise Chaining

프로미스에서 `then()`을 호출하고 나면 또 새로운 프로미스를 반환하기에 `then()`을 무한정 이어갈 수 있다.  
그래서 아래와 같이 chaining을 이어갈 수 있다.

```
new Promise((resolve) => {
  resolve();
})
.then(() => {

})
.then(() => {

})
.then(()=> {

})
...
```

### 사족

앞으로 도커 사용기, 서버리스 이미지 리사이징 구현기, 모니터링 환경 구성(프로메테우스, 여러 exporter, 그라파나를 도커 컴포즈로 띄움)기 정리해야하는데..  
프로젝트는 산더미처럼 남아있고 할 게 많다 😢.
