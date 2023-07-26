`never`和`void`有什么区别

```ts
// 在JavaScript中如果函数没有显示返回任何值，会隐式返回undefined
// 在编写一个不返回任何值的函数时，可以使用void来表示该函数没有返回值（undefined）
const logError = (): void => {
  console.log('Something went wrong!');
};

console.log(logError()); // undefined


// never用于函数时，意味着该函数抛出一个错误或者永远不会完成运行（死循环
const throwError = (): never => {
  throw new Error('Something went wrong!');
};

const infiniteLoop = (): never => {
  while (true) {
    console.log('loop');
  }
};
```

协变与逆变

>在类型系统中，属性更多的类型是子类型。对于联合类型，范围更小的是子类型。**子类型比父类型更具体**。

- 子类型可以赋值给父类型，叫做协变
- 父类型可以赋值给子类型，叫做逆变

```ts
// -----------------协变的例子-----------------
type Parent = {
  name: string;
};

// Child是Parent的子类型（更具体
type Child = {
  name: string;
  age: number;
};

let a: Parent;
let b: Child;

// √
// b有a中的所有属性，因此把b赋值给a是安全的
// 因为访问a上的属性，b都有
a = b;

// ×
// Property 'age' is missing in type 'A' but required in type 'B'
// 而把a赋值给b是不安全的
b = a;


// -----------------逆变的例子-----------------
let fnA = (a: Parent) => {
  console.log(a.name)
}

let fnB = (b: Child) => {
  console.log(b.age)
}


// Type '(b: Child) => void' is not assignable to type '(a: Parent) => void'.
// Types of parameters 'b' and 'a' are incompatible.
// Type 'Parent' is not assignable to type 'Child'.
// ×
// fnB的参数是更具体的子类型（Child），把fnB赋值给fnA后，因为fnA的参数是父类型（Parent）
// 所以会把Parent类型的参数传递给fnB，是不安全的
fnA = fnB

// √
// 而把fnA赋值给fnB，本身fnB的参数就是fnA参数的子类型，就是会把子类型传递给父类型，是安全的
fnB = fnA


// 注意：在TypeScript中，对于函数参数默认的处理是 双向协变（既支持协变，也支持逆变） 的
// 在开启了 tsconfig 中的 strictFunctionType 后才会严格按照 逆变 来约束赋值关系。
```