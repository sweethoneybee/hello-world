# Async function

async funciton은 AsyncFunction 객체를 반환하는 하나의 비동기 함수를 정의한다. 비동기 함수는 이벤트루프를 통해
비동기적으로 작동하는 함수로, 암시적으로 Promise를 사용하여 결과를 반환한다. 그러나 비동기 함수를 사용하는 구문과 구조는,
표준 동기함수를 사용하는 것과 많이 비슷하다.  
-> async를 사용해서 동기형 프로그래밍 언어처럼 코드를 작성할 수 있게 되었다.

```
function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(()=> {
      resolve("resolved")'
    }, 2000)
  });
}

async function asyncCall() {
  console.log("calling");
  const result = await resolveAfter2Seconds();
  console.log(result);
  // expected output: "resolved"
}

asyncCall();
```

`async`함수에는 `await`이 쓰일 수 있는데, 이 `await`은 ** `async`함수를 일시 중지**하고 전달된 `Promise`의 해결을 기다린 다음
`async`함수의 실행을 다시 시작하고 완료 후 값을 반환한다.

> 현재까지는 문법적으로 `async`가 붙은 함수 내에서만 `await` 키워드를 사용할 수 있다.

## 간단한 예시 코드

```
var resolveAfter2Seconds = function() {
  console.log("starting slow promise");
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(20);
      console.log("slow promise is done");
    }, 2000);
  });
};

var resolveAfter1Second = function() {
  console.log("starting fast promise");
  return new Promise(resolve => {
    setTimeout(()=>{
      resolve(10);
      console.log("fast promise is done");
    }, 1000);
  });
};

var sequentialStart = async function() {
  console.log("==SEQUENTIAL START==");

  // 만약 await 다음에 오는 expression의 값이 `Promise`가 아니라면, resolve된 Promise로 변환이 된다.
  const slow = await resolveAfter2Seconds();
  console.log(slow);

  const fast = await resolveAfter1Second();
  console.log(fast);
}

var concurrentStart = async function() {
  console.log("==CONCURRENT START with await==");
  const slow = resolveAfter2Seconds(); // 타이머가 바로 시작됨
  const fast = resolveAfter1Second();

  console.log(await slow);
  console.log(await fast); // fast가 먼저 끝나더라도(먼저 resolve 되긴 한다), slow가 끝날 때까지 기다린다. 여기서 끝난다는 말은 Promise가 resolve된다는 뜻이다.
}

var stillConcurrent = function() {
  console.log("==CONCURRENT START with Promise.all==");
  Promise.all([resolveAfter2Seconds(), resolveAfter1Second()]).then((message) => {
    console.log(message[0]); // 20
    console.log(message[1]); // 10
  });
}

var parallel = function() {
  console.log("==PARALLEL with Promise.then==");
  resolveAfter2Seconds().then((message) => console.log(message));
  resolveAfter1Second().then((message) => console.log(message));
}

sequentialStart(); // 2초 뒤에, "slow"가 찍히고 그리고 1초 뒤에 "fast"가 찍힌다
setTimeout(concurrentStart, 4000); // 2초 뒤에 "slow"가 찍히고 그다음 바로 "fast"가 찍힌다.
setTimeout(stillConcurrent, 7000); // concurrentStart와 동일한 결과가 나온다
setTimeout(parallel, 10000); // 동시에 시작되었으니 일반적인 값이 나올 것이다. 1초뒤에 10(fast)가 찍히고 그리고 또 1초 뒤에 20(slow)"가 찍힌다.
```

위의 예시코드를 실행시켜보면 알 수 있지만, `await`이 붙으면 뒤의 expression의 `Promise`가 resolve될 떄까지 `async`함수를 중단시킨다.  
(추가로 expression의 값이 `Promise`가 아니라면 암묵적으로 resolve 된 `Promise`로 변환시킨다)  
그래서 `resolveAfter1Second`가 먼저 resolve 되긴 하지만, `resolveAfter2Seconds`가 resolve될 때까지 기다려야 하는 경우가 있는 것이다.

## 놓칠 수 있는 몇 가지 사실

1. `await`이 붙은 expression의 값이 resolve된 `Promise` 값으로 변환된다.  
   ex)

```
async function getProcessedData(url) {
  let v;
  try {
    v = await downloadData(url);
  } catch(e) {
    v = await downloadFallBackData(url);
  }
  return processDataInWorker(v); // return 구문에 await이 붙지 않았다. 이는 async 함수의 리턴갑싱 암묵적으로 `Promise.resolve`로 감싸지기 떄문이다.
}
```

2. `async function`의 반환값은 암묵적으로 `Promise.resolve`로 감싸진다.
3. `await`식은 함수의 실행을 일시 중지하고 전달 받은 `Promise`의 resolve를 기다린 다음 다시 함수를 시작한다.

### 출처

[MDN web docs - async function](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function)
