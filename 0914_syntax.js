console.log("wow!!");
var isDone = false;
var decimal = 6;
var hex = 0xf00d;
var binary = 10;
var octal = 484;
var color = "blue";
color = "red";
var list_1 = [1, 2, 3];
var list_2 = [1, 2, 3];
var x;
x = ["hello", 10];
var Color;
(function (Color) {
  Color[(Color["Red"] = 2)] = "Red";
  Color[(Color["Green"] = 3)] = "Green";
  Color[(Color["Blue"] = 4)] = "Blue";
})(Color || (Color = {}));
var c = Color.Red;
var notSure = 4;
notSure = "maybe a string instead";
notSure = false;
const aNumber: number = maybe;
if (maybe === true) {
  var aBoolean = maybe;
  // const aString: string = maybe;
}
if (typeof maybe === "string") {
  var aString = maybe;
  // const aBoolean: boolean = maybe;
}
var str = getValue("myString");
var looselyTyped = 4;
looselyTyped.ifExist();
var strictlyTyped = 4;
// strictlyTyped.toFixed();
var looselyTyped_2 = {};
var d = looselyTyped.a.b.c.d;
// = let d: nay
function warnUser() {
  console.log("This is my warning message");
  // return 0;
}
var u = undefined;
var n = null;
function error(message) {
  console.log("hi");
  while (true) {}
  throw new Error(message);
  // return 0;
}
create({ prop: 0 });
create(null);
// create(42);
// create(false);
// create(undefined);
var someValue = "this is a string";
var strLength = someValue.length;
var strLength_2 = someValue.length;
console.log("wow!!");
