console.log("wow!!");
let isDone: boolean = false;

let decimal: number = 6;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;

let color: string = "blue";
color = "red";

let list_1: number[] = [1, 2, 3];
let list_2: Array<number> = [1, 2, 3];

let x: [string, number];
x = ["hello", 10];

enum Color {
  Red = 2,
  Green,
  Blue,
}
let c: Color = Color.Red;

let notSure: unknown = 4;
notSure = "maybe a string instead";

notSure = false;

declare const maybe: unknown;
// const aNumber: number = maybe;
if (maybe === true) {
  const aBoolean: boolean = maybe;
  // const aString: string = maybe;
}

if (typeof maybe === "string") {
  const aString: string = maybe;
  // const aBoolean: boolean = maybe;
}

declare function getValue(key: string): any;
const str: string = getValue("myString");

let looselyTyped: any = 4;
looselyTyped.ifExist();

let strictlyTyped: unknown = 4;
// strictlyTyped.toFixed();
let looselyTyped_2: any = {};
let d = looselyTyped.a.b.c.d;
// = let d: nay

function warnUser(): void {
  console.log("This is my warning message");
  // return 0;
}

let u: undefined = undefined;
let n: null = null;

function error(message: string): never {
  console.log("hi");

  while (true) {}
  throw new Error(message);
  // return 0;
}

declare function create(o: object | null): void;
create({ prop: 0 });
create(null);

// create(42);
// create(false);
// create(undefined);

let someValue: unknown = "this is a string";
let strLength: number = (someValue as string).length;
let strLength_2: number = (<string>someValue).length;

console.log("wow!!");
