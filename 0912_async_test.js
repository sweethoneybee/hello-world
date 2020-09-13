var resolveAfter2Seconds = function () {
  console.log("starting slow promise");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(20);
      console.log("slow promise is done");
    }, 2000);
  });
};

var resolveAfter1Second = function () {
  console.log("starting fast promise");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(10);
      console.log("fast promise is done");
    }, 1000);
  });
};

var sequentialStart = async function () {
  console.log("==SEQUENTIAL START==");

  // 만약 await 다음에 오는 expression의 값이 `Promise`가 아니라면, resolve된 Promise로 변환이 된다.
  const slow = await resolveAfter2Seconds();
  console.log(slow);

  const fast = await resolveAfter1Second();
  console.log(fast);
};

var concurrentStart = async function () {
  console.log("==CONCURRENT START with await==");
  const slow = resolveAfter2Seconds(); // 타이머가 바로 시작됨
  const fast = resolveAfter1Second();

  console.log(await slow);
  console.log(await fast); // fast가 먼저 끝나더라도, slow가 끝날 때까지 기다린다. 여기서 끝난다는 말은 Promise가 resolve된다는 뜻이다.
};

var stillConcurrent = function () {
  console.log("==CONCURRENT START with Promise.all==");
  Promise.all([resolveAfter2Seconds(), resolveAfter1Second()]).then(
    (message) => {
      console.log(message[0]); // slow
      console.log(message[1]); // fast
    }
  );
};

var parallel = function () {
  console.log("==PARALLEL with Promise.then==");
  resolveAfter2Seconds().then((message) => console.log(message));
  resolveAfter1Second().then((message) => console.log(message));
};

sequentialStart(); // 2초 뒤에, "slow"가 찍히고 그리고 1초 뒤에 "fast"가 찍힌다
setTimeout(concurrentStart, 4000); // 2초 뒤에 "slow"가 찍히고 그다음 바로 "fast"가 찍힌다.
setTimeout(stillConcurrent, 7000); // concurrentStart와 동일한 결과가 나온다
setTimeout(parallel, 10000); // 동시에 시작되었으니 일반적인 값이 나올 것이다. 1초뒤에 "fast"가 찍히고 그리고 또 1초 뒤에 "slow"가 찍힌다.
