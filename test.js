const test = () => {
  return new Promise((resolve, reject) => {
    resolve(100);
    reject(new Error("으아니!"));
  }).then((data) => data + 200);
};

test()
  .then((data) => {
    console.log(data);
  })
  .catch((err) => {
    console.log("잡았다 요놈");
    console.log(err);
  });

new Promise((resolve) => {
  resolve(400);
}).then((data) => console.log(data));

const test2 = async () => {
  console.log("뭐지");
  return 10;
};

try {
  (async () => {
    await test2();
  })();
} catch (err) {
  console.log("아무튼 에러");
  console.log(err);
}
