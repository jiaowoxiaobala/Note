# Hooks系列

结构尽量保持和官方文档一致


## [useState](https://react.dev/reference/react/useState)

>用于在函数式组件中声明状态。

```react
const [state, setState] = useState(initialState)
```

## 1. Reference

### Parameters

>`initialState`初始值有两种情况，函数和非函数。当初始值是函数时`React`会在组件初始化时调用这个函数，并将它的返回值存储起来，这个函数需要是纯函数（没有副作用）。

```ts
// 任意类型的值
const [age, setAge] = useState(18)

// 传递函数
const [todos, setTodos] = useState(() => createTodos())
```

### Returns

>返回值是一个数组，包含两个值。
 - `current state`: 当前状态，在第一次渲染期间它就是传入的`initialState`
 - `set function`：改变状态的函数，它允许更新为不同的值，然后触发组件重新渲染

### Caveats

>`useState`只能在组件的作用域顶层被调用，不能在循环和条件判断中。在严格模式中，当`initialState`是函数时，`React`会调用两次，因为需要检测它是不是纯函数（只是开发环境的行为，对生产没有影响。

### `Set` functions, like `setSomething(nextState)`

>可以直接给`set function`传递更新的状态，也可以传入一个函数从上一次状态计算更新的状态。

```ts
const [name, setName] = useState('bow')
const [age, setAge] = useState(18)

function handleClick () {
  setName('bw')

  // 传入函数时，会接受一个参数（上一次的状态
  const res = setAge(age => age + 1)

  // undefined 更新函数没有返回值
  console.log(res) 
}
```

### Caveats

- 更新函数会在下一次渲染更新状态，如果在调用更新函数之后就读取这个状态，仍然会得到更新前的状态(`old value`)

```ts
const [age, setAge] = useState(18)

setAge(19)

console.log(age) // 18
```
- 如果更新的状态和旧状态一致（`React`通过`Object.is`比较），那么会跳过重新渲染

```ts
const [age, setAge] = useState(18)

setAge(18) // 忽视这次状态变化

const [person, setPerson] = useState({
  age: 18
})

person.age = 19
setPerson(person) // 忽视这次状态变化，引用类型引用地址一致

setPerson({ ...person, age: 19 }) // 更新状态，触发重渲染
```

- `React`批量更新状态，`React`在所有的事件处理程序运行并调用它们的`set function`后更新屏幕，可以防止在一个事件中多次重新渲染，在少数情况下可能需要强制`React`尽早的更新视图，比如访问`DOM`，可以使用`flushSync`

```ts
const [age, setAge] = useState(18)

const handleClick = () => {
  setAge(age + 1)
  setAge(age + 1)
  setAge(age + 1)
  setAge(age + 1)
  setAge(age + 1)

  // 18 -> 19每次点击只会加1，并且是在下一次渲染时更新
  console.log(age)
}
```

- 严格模式中，`React`会调用更新函数两次，这是开发环境的行为，不会有其它影响


## 2. Usage

### Adding state to a component 

>略

### Updating state based on the previous state

```ts
// 假设age = 42，这里虽然调用了三次setAge，在下次更新时，age仍然是43
function handleClick() {
  setAge(age + 1); // setAge(42 + 1)
  setAge(age + 1); // setAge(42 + 1)
  setAge(age + 1); // setAge(42 + 1)
}

// 可以通过传递一个更新函数来解决这个问题
function handleClick() {
  setAge(a => a + 1) // setAge(42 + 1)
  setAge(a => a + 1) // setAge(43 + 1)
  setAge(a => a + 1) // setAge(44 + 1)
}
```

### Updating objects and arrays in state
>在`React`中状态被认为是只读的，因此在更新状态为数组或对象时，应该直接替换它们，而不是修改它们。

```ts
const [person, setPerson] = useState({
  age: 18
})

// Bad
person.age++
setPerson(person)

// Good
setPerson({
  ...person,
  age: person.age + 1
})
```


### Avoiding recreating the initial state

>`React`会保存初始状态并在下一次渲染时忽略它。

```ts
// Bad
function TodoList() {
  // 这个例子中，虽然createInitialTodos()的结果只会被使用在初始渲染中
  // 但是它仍然会在每一次渲染中调用
  const [todos, setTodos] = useState(createInitialTodos());
}


// Good
function TodoList() {
  // 作为初始化函数传递，只会在初始渲染中调用
  const [todos, setTodos] = useState(createInitialTodos);
}
```

### Resetting state with a key
>除了在渲染列表时，`key`很常见，它还有另一个用途。可以通过给组件传递一个不同的`key`重置组件的状态

```ts
import { useState } from 'react';

export default function App() {
  const [version, setVersion] = useState(0);

  function handleReset() {
    setVersion(version + 1);
  }

  return (
    <>
      // 点击按钮时修改Form组件的key，会触发Form组件中的所有状态重置
      <button onClick={handleReset}>Reset</button>
      // 给Form组件传递一个key的prop
      <Form key={version} />
    </>
  );
}

function Form() {
  const [name, setName] = useState('Taylor');

  return (
    <>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <p>Hello, {name}.</p>
    </>
  );
}
```

### Storing information from previous renders

- 如果需要的值可以从当前的`props`或者其他`state`中直接计算出来，就删掉冗余的状态，如果担心重新计算的太频繁，可以使用`useMemo`

- 如果想要完全重置组件的所有状态，传递一个不同的`key`

- 尽可能在更新事件中处理程序的所有相关状态

```ts
import { useState } from 'react';

function CountLabel({ count }) {
  // 基于count prop声明一个状态，保留每次渲染后它的上一个状态信息
  const [prevCount, setPrevCount] = useState(count);
  const [trend, setTrend] = useState(null);
  if (prevCount !== count) {
    setPrevCount(count);
    setTrend(count > prevCount ? 'increasing' : 'decreasing');
  }
  return (
    <>
      <h1>{count}</h1>
      {trend && <p>The count is {trend}</p>}
    </>
  );
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
      <CountLabel count={count} />
    </>
  );
}
```

## 3. Troubleshooting 

### I’ve updated the state, but logging gives me the old value

>`state`像一个快照，更新状态请求在另一个渲染中是一个新的状态，但是它不会影响这个状态在已经执行的事件处理程序中。

```ts
function handleClick() {
  console.log(count);  // 0

  setCount(count + 1); // Request a re-render with 1

  console.log(count);  // Still 0!

  setTimeout(() => {
    console.log(count); // Also 0!
  }, 5000);
}


// 如果需要使用下一个状态，可以使用一个变量存储它（把它传递给set function前
const nextCount = count + 1
setCount(nextCount)

console.log(count);     // 0
console.log(nextCount); // 1
```

### I’ve updated the state, but the screen doesn’t update
>如果你的状态更新和上一个状态是相等的，那么`React`会忽视它，内部通过使用`Object.is`做比较，这通常发生在你直接改变一个对象或数组时。

```ts
// Bad
obj.x = 10

setObj(obj)

// Good
setObj({
  ...obj,
  x: 10
})
```

### I’m getting an error: “Too many re-renders” 
>`React`限制渲染次数为了防止无线循环，通常是在渲染期间无条件的设置状态导致。

```ts
// Wrong: calls the handler during render
return <button onClick={handleClick()}>Click me</button>

// Correct: passes down the event handler
return <button onClick={handleClick}>Click me</button>

// Correct: passes down an inline function
return <button onClick={(e) => handleClick(e)}>Click me</button>
```

### My initializer or updater function runs twice
>略

### I’m trying to set state to a function, but it gets called instead 
>不能直接传递一个函数作为状态，当传递一个函数时，`React`会假设它是一个初始化函数，因此会调用这个函数存储它的返回值。通常需要加上`() =>`

```ts
// Bad
const [fn, setFn] = useState(someFunction);

function handleClick() {
  setFn(someOtherFunction);
}

// Good
const [fn, setFn] = useState(() => someFunction);

function handleClick() {
  setFn(() => someOtherFunction);
}
```

-----------------------------

## [UseMemo](https://react.dev/reference/react/useMemo)

>在重新渲染之间缓存计算结果。（由于每一次状态更新都会导致组件重新渲染