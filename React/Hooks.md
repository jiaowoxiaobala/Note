# 跟着官网学习React

https://react.docschina.org/reference/react/useState

## useState

>用于在函数式组件中声明状态

```react
const [state, setState] = useState(initialState)
```

### 1. Parameters

>`initialState`初始值有两种情况，函数和非函数。当初始值是函数时`React`会在组件初始化时调用这个函数，并将它的返回值存储起来，这个函数需要是纯函数（没有副作用）

```ts
// 任意类型的值
const [age, setAge] = useState(18)

// 传递函数
const [todos, setTodos] = useState(() => createTodos())
```

### 2. Returns

>返回值是一个数组，包含两个值。
 - `current state`: 当前状态，在第一次渲染期间它就是传入的`initialState`
 - `set function`：改变状态的函数，它允许更新为不同的值，然后触发组件重新渲染

### 3. Caveats

>`useState`只能在组件的作用域顶层被调用，不能在循环和条件判断中。在严格模式中，当`initialState`是函数时，`React`会调用两次，只是开发环境的行为，对生产没有影响。

### 4. `Set` functions, like `setSomething(nextState)`

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

#### 4.1 Caveats

- 这个更新函数会在下一次渲染更新状态，如果在调用更新函数之后就读取这个状态，仍然会得到更新前的状态(`old value`)

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

- `React`批量更新状态，`React`在所有的事件处理程序运行并调用它们的`set function`后更新屏幕，可以防止在一个事件中多次重新渲染，