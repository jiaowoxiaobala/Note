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