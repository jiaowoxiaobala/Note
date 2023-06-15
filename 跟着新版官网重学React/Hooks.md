# Hooks系列

文档目录结构保持和官方文档一致，例子全部来自官网。

## [useCallback](https://react.dev/reference/react/useCallback)

>在组件重新渲染之间缓存一个函数（需要配合`memo`使用

```ts
const cacheFn = useCallback(fn, dependencies)
```

## 1.Reference

### Parameters

- `fn`：需要缓存的函数，可以接收任意个数的参数以及返回任意类型的值。在初始化渲染期间，`React`会返回这个函数（不会调用它），下一次渲染时，当依赖性没有发生变化，`React`会再一次返回这个相同的函数。

- `dependencies`：`fn`中使用的所有响应式值的列表，响应式值包含`props`、`state`以及所有变量，函数声明包含在组件内部的。依赖性列表必须具体恒定数量的项，`React`将使用`Object.is`比较每个依赖性与其先前的值

### Returns

>在初始化渲染期间，`useCallback`返回传递的函数；在之后的渲染中，它要么返回在上一次渲染中存储的函数，要么返回一个在当前渲染期间传递的函数（新的函数）

### Caveats

- 只能在组件的顶层作用域中调用，不能在循环和条件语句中调用
- 略


## 2. Usage

### Skipping re-rendering of components 
>在优化渲染性能时，可以缓存传递给子组件的函数。默认行为下，当一个组件重新渲染时，`React`会递归地渲染它的所有子组件

```ts
import { memo } from 'react';

// 需要配合memo一起使用
const ShippingForm = memo(function ShippingForm({ onSubmit }) {
  // ...
});

function ProductPage({ productId, referrer, theme }) {
  // ...

  // 通过包裹在useCallback中，可以确保在重新渲染期间，这个函数是相同的（直到依赖项变化
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]);

  return (
    <div className={theme}>
      <ShippingForm onSubmit={handleSubmit} />
    </div>
  );
}
```

### DEEP DIVE：How is useCallback related to useMemo? 

>不同之处在于它们允许缓存的内容

- `useMemo`：缓存的是调用函数参数的返回值。
- `useCallback`：缓存额是函数参数本身（不会调用。

```ts
// Simplified implementation (inside React)
function useCallback(fn, dependencies) {
  return useMemo(() => fn, dependencies);
}
```

### Updating state from a memoized callback

>有些时候在一个缓存函数里，需要基于上一次状态去更新状态。

```ts
function TodoList() {
  const [todos, setTodos] = useState([]);

  const handleAddTodo = useCallback((text) => {
    const newTodo = { id: nextId++, text };
    setTodos([...todos, newTodo]);
  }, [todos]);
  // ...
}

function TodoList() {
  const [todos, setTodos] = useState([]);

  // 通常都想要尽可能少的依赖，这种情况下可以去掉依赖
  const handleAddTodo = useCallback((text) => {
    const newTodo = { id: nextId++, text };
    setTodos(todos => [...todos, newTodo]);
  }, []); // No need for the todos dependency
  // ...
}
```

### Preventing an Effect from firing too often

>有些时候可能需要在`Effect`中调用一个函数

```ts
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  function createOptions() {
    return {
      serverUrl: 'https://localhost:1234',
      roomId: roomId
    };
  }

  // 这里有个问题，每个响应值都必须声明为Effect的依赖项
  // 然而如果声明了createOptions作为依赖项，这会造成不断重新连接这个chat room
  useEffect(() => {
    const options = createOptions();
    const connection = createConnection();
    connection.connect();
    // ...
  })
}

// fix
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  // 将这个函数用useCallback包裹，确保它在重新渲染期间当roomId是相同时
  // 它也是相同的
  const createOptions = useCallback(() => {
    return {
      serverUrl: 'https://localhost:1234',
      roomId: roomId
    };
  }, [roomId]); //  Only changes when roomId changes

  useEffect(() => {
    const options = createOptions();
    const connection = createConnection();
    connection.connect();
    return () => connection.disconnect();
  }, [createOptions]); // Only changes when createOptions changes
  // ...
}

// better fix
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    function createOptions() { // No need for useCallback or function dependencies!
      return {
        serverUrl: 'https://localhost:1234',
        roomId: roomId
      };
    }

    const options = createOptions();
    const connection = createConnection();
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // Only changes when roomId changes
  // ...
}
```

### Optimizing a custom Hook

>如果需要写自定义Hook，推荐将它返回的函数都用`useCallback`包裹。

```ts
function useRouter() {
  const { dispatch } = useContext(RouterStateContext);

  const navigate = useCallback((url) => {
    dispatch({ type: 'navigate', url });
  }, [dispatch]);

  const goBack = useCallback(() => {
    dispatch({ type: 'back' });
  }, [dispatch]);

  // 这可以确保使用这个Hook时，可以在需要的时候优化代码
  return {
    navigate,
    goBack,
  };
}
```

## 3. Troubleshooting 

### Every time my component renders, useCallback returns a different function

>确保是否写了依赖项数组，略。

### I need to call useCallback for each list item in a loop, but it’s not allowed

>不能在循环中直接调用Hook。

## 4.一句话总结用法

>`useCallback`接受两个参数，第一个参数是函数，会把这个函数缓存起来（不会调用），第二个参数是依赖项数组(确保这些依赖在这个函数中使用)，`React`通过`Object.is`去比较依赖项的变化，如果没有发生变化，在下次渲染期间返回的函数是相同的，需要配合`memo`一起使用。

## [useContext](https://react.dev/reference/react/useContext)

>用于读取和订阅组件中的上下文信息。

```react
const value = useContext(SomeContext)
```

## 1.Reference

### Parameters

- `SomeContext`：这个`context`是先前用`createContext`创建的，`context`本身不包含信息，只代表你能从组件中提供或者读取的信息类型。

### Return

>给调用的组件返回`context`的值，这个值是该组件上方最近的`SomeContext.Provider`的值，如果没有这样的`Provider`，那么返回值就是传递给`createContext`的`defaultValue`。这个值始终是最新的，`React`会自动重新渲染组件当读到某些`context`发生变化。

### Caveats

- `useContext`的调用不会受到相同组件返回的`provider`的影响，相应的`Context.Provider`需要位于调用`useContext`的组件上面。
- 从`provider`接收到不同的值开始，`React`会自动重新渲染使用了该特定`context`的所有子组件，通过`Object.is`来比较新值和旧值，使用`memo`来跳过重新渲染不会妨碍子组件接受到新的`context`的值。
- 只有在用于传递`context`的`SomeContext `和用于读取数据的`SomeContext`是完全相同的对象时才有效，通过`===`全等进行比较。

## 2. Usage

### Passing data deeply into the tree
>`useContext`返回向`context`传递的值，为了确认`context`的值，`React`会搜索组件树，为这个特定的`context`向上查找最近的`Context.Privder`。

```ts
// useContext需要和createContext配合使用
import { createContext, useContext } from 'react';

// createContext接受一个值作为context的默认值，返回一个上下文对象
const ThemeContext = createContext(null);

export default function MyApp() {
  return (
    // 为包裹的组件提供上下文
    <ThemeContext.Provider value="dark">
      <Form />
    </ThemeContext.Provider>
  )
}

function Form() {
  return (
    <Panel title="Welcome">
      <Button>Sign up</Button>
      <Button>Log in</Button>
    </Panel>
  );
}

function Panel({ title, children }) {
  const theme = useContext(ThemeContext);
  const className = 'panel-' + theme;
  return (
    <section className={className}>
      <h1>{title}</h1>
      {children}
    </section>
  )
}

// 不管这个Button和provider之间嵌套多深，它都能接收到theme
function Button({ children }) {
  // 读取上下文信息
  const theme = useContext(ThemeContext);
  const className = 'button-' + theme;
  return (
    <button className={className}>
      {children}
    </button>
  );
}
```

### Updating data passed via context
>通过与`state`结合，让`context`的值成为响应式的。

```ts
function MyPage() {
  // 在组件内部声明一个状态变量theme
  const [theme, setTheme] = useState('dark');
  return (
    // 将这个状态变量作为context value传递给provider
    <ThemeContext.Provider value={theme}>
      <Form />

      // 当点击按钮触发state变化时，所有使用该provider提供的context value的子组件都会重新渲染
      <Button onClick={() => {
        setTheme('light');
      }}>
       Switch to light theme
      </Button>
    </ThemeContext.Provider>
  );
}
```

```ts
import { createContext, useContext, useState } from 'react';

const CurrentUserContext = createContext(null);

export default function MyApp() {
  const [currentUser, setCurrentUser] = useState(null);
  return (

    // 通过context传递一个对象
    <CurrentUserContext.Provider
      value={{
        currentUser,
        setCurrentUser
      }}
    >
      <Form />
    </CurrentUserContext.Provider>
  );
}

function Form({ children }) {
  return (
    <Panel title="Welcome">
      <LoginButton />
    </Panel>
  );
}

function LoginButton() {
  const {
    currentUser,
    setCurrentUser
  } = useContext(CurrentUserContext);

  if (currentUser !== null) {
    return <p>You logged in as {currentUser.name}.</p>;
  }

  return (
    <Button onClick={() => {
      setCurrentUser({ name: 'Advika' })
    }}>Log in as Advika</Button>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <h1>{title}</h1>
      {children}
    </section>
  )
}

function Button({ children, onClick }) {
  return (
    <button className="button" onClick={onClick}>
      {children}
    </button>
  );
}
```

### Specifying a fallback default value
>如果`React`没有在父组件树中找到该特定`context`的任何`provider`，`useContext`返回的值就是在`creatContext`时指定的默认值。

- 略

### Overriding context for a part of the tree

>可以根据需要嵌套和覆盖`provider`。

```ts
import { createContext, useContext } from 'react';

const ThemeContext = createContext(null);

export default function MyApp() {
  return (
    <ThemeContext.Provider value="dark">
      <Form />
    </ThemeContext.Provider>
  )
}

function Form() {
  return (
    <Panel title="Welcome">
      // 这个Button组件内部读到的context value 是dark
      <Button>Sign up</Button>
      <Button>Log in</Button>
      // 在Form组件里内部又嵌套了一个provider
      <ThemeContext.Provider value="light">
        // 这里的Fotter组件内部读到的context value是light
        <Footer />
      </ThemeContext.Provider>
    </Panel>
  );
}

function Footer() {
  return (
    <footer>
      <Button>Settings</Button>
    </footer>
  );
}

function Panel({ title, children }) {
  const theme = useContext(ThemeContext);
  const className = 'panel-' + theme;
  return (
    <section className={className}>
      {title && <h1>{title}</h1>}
      {children}
    </section>
  )
}

function Button({ children }) {
  const theme = useContext(ThemeContext);
  const className = 'button-' + theme;
  return (
    <button className={className}>
      {children}
    </button>
  );
}
```

### Optimizing re-renders when passing objects and functions
>可以给`context`传递任何值，包括对象和函数。

```ts
function MyApp() {
  const [currentUser, setCurrentUser] = useState(null);

  function login(response) {
    storeCredentials(response.credentials);
    setCurrentUser(response.user);
  }

  return (
    // 这里 context value是一个具有两个属性的对象，其中一个是函数
    // 每当MyApp组件重新渲染时，这个对象都会是一个不同的对象
    // 因此React还会重新渲染组件树中所有调用useContext的组件
    <AuthContext.Provider value={{ currentUser, login }}>
      <Page />
    </AuthContext.Provider>
  );
}

// fix
import { useCallback, useMemo } from 'react';

function MyApp() {
  const [currentUser, setCurrentUser] = useState(null);

  // 通过useCallback包裹，并声明空的依赖项数组，表示这个函数永远都是同一个
  const login = useCallback((response) => {
    storeCredentials(response.credentials);
    setCurrentUser(response.user);
  }, []);

  // 通过useMemo包裹，只有在login和currentUser发生变化后，才会返回一个新的对象
  const contextValue = useMemo(() => ({
    currentUser,
    login
  }), [currentUser, login]);

  return (
    <AuthContext.Provider value={contextValue}>
      <Page />
    </AuthContext.Provider>
  );
}
```

## 3. Troubleshooting

### My component doesn’t see the value from my provider

- 在调用`useContext()`的同一组件（或下层）渲染`<SomeContext.Provider>`。
- 可能忘记使用`<SomeContext.Provider>`包装组件，或者可能将组件放在组件树的不同部分。
- 工具问题，略。

### I am always getting undefined from my context although the default value is different

- 可能在组件树中有一个没有设置`value`的`provider`。只有在上层没有匹配到`provider`时，才会使用`createContext`的默认值，如果存在`<SomeContext.Provider>`在上层，调用`useContext`的组件会接收到`undefined`作为context的值。

```ts
// 如果没有传递value，相当于value={undefined}
<ThemeContext.Provider>
   <Button />
</ThemeContext.Provider>
```

## 4一句话总结用法
>`useContext`是一种跨组件通信的方式，需要配合`createContext`使用，通过`createContext`创建一个上下文，然后用它返回的上下文对象的`provider`包裹需要接收上下文的所有组件，在这些组件中使用`useContext`就可以获取到传递上下文的值。


## [useState](https://react.dev/reference/react/useState)

>用于在函数式组件中声明状态。

```react
const [state, setState] = useState(initialState)
```

## 1. Reference

### Parameters

- `initialState`：初始值有两种情况，函数和非函数。当初始值是函数时`React`会在组件初始化时调用这个函数，并将它的返回值存储起来，这个函数需要是纯函数（没有副作用）。

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

## 4. 一句话总结用法

>`useState`接受两个参数，第一个是状态的初始值，如果初始值是函数，会在初始化渲染期间调用这个函数，并将其返回值存储起来；第二个参数是更新状态的函数，这个更新函数调用时，传递的参数如果是函数会接收到上一次状态的值，然后将其调用结果作为新的状态更新。

-----------------------------

## [UseMemo](https://react.dev/reference/react/useMemo)

>在组件重新渲染之间缓存计算结果。（由于每一次状态更新都会导致组件重新渲染

```ts
const cachedValue = useMemo(calculateValue, dependencies)
```

## 1. Reference

### Parameters

- `calculateValue`：需要缓存值的计算函数，它必须是纯函数，没有任何参数，返回一个任意类型的值。`React`将会调用这个函数在初始化渲染期间，在下次渲染时`React`将会返回相同的结果（如果`dependencies`在上一次渲染后没有任何变化），否则`React`将再次调用这个`calculateValue`拿到最新的返回结果进行缓存

- `dependencies`：在`calculateValue`中使用的所有响应式值的列表，响应式值包含`props`、`state`以及所有变量，函数声明包含在组件内部的。依赖性列表必须具体恒定数量的项，`React`将使用`Object.is`比较每个依赖性与其先前的值

### Returns
>在初始化渲染中，`useMemo`的返回值是`calculateValue`调用后的返回值;在下一个渲染期间，它要么是上次渲染缓存的值，要么是再次调用`calculateValue`的返回值。

### Caveats

- 只能在组件的顶层作用域中调用，不能在循环和条件语句中调用
- 严格模式中，`React`会调用计算函数两次，这是为了检查是不是纯函数，开发环境的行为

## 2. Usage

### Skipping expensive recalculations

>`useCache`在重新渲染之间缓存一个计算结果，直到它的依赖性发生变化

```ts
// 如果这个TodoList更新了状态，或者接受了一个新的props，这个filterTodos函数就会重新执行
// 通常这不是一个问题，因为大多数计算都是非常快的，如果filter了一个大的数组，或者做了一些"昂贵"的计算
// 你可能就想跳过它（如果数据没有发生改变
function TodoList({ todos, tab, theme }) {
  const visibleTodos = filterTodos(todos, tab);
  // ...
}

// fix
// 用useMemo包裹这个计算函数
function TodoList({ todos, tab, theme }) {
  const visibleTodos = useMemo(() => filterTodos(todos, tab), [todos, tab])
  // ...
}
```

### Skipping re-rendering of components 

>某些情况下，`useMemo`能优化子组件重新渲染的性能问题，默认情况下当一个组件重新渲染时，`React`会递归地渲染它的所有子组件

```ts
// 这里当TodoList因为theme重新渲染时，List组件也会重新渲染
// 如果这个重新渲染很慢，就需要告诉List组件跳过这次渲染
function TodoList({ todos, tab, theme }) {
  // ...
  return (
    <div className={theme}>
      <List items={visibleTodos} />
    </div>
  );
}

// fix
import { useMemo } from 'react'

const List = useMemo(function List({ items })) {
  // ...
}
```

### Memoizing a dependency of another Hook

```ts
// 假设这个visibleItems依赖一个直接在组件内部创建的对象
function Dropdown({ allItems, text }) {

  // 当这个这个组件Dropdown重新渲染时，所有组件内部的代码都会重新执行，因此
  // searchOptions每一次都是不同的新对象，就会导致每次都要重新计算searchItems
  const searchOptions = { matchMode: 'whole-word', text };

  const visibleItems = useMemo(() => {
    return searchItems(allItems, searchOptions);
  }, [allItems, searchOptions]); 
  // ...
}

// fix
function Dropdown({ allItems, text }) {
  
  // text改变时，才会创建一个新对象
  const searchOptions = useMemo(() => {
    return { matchMode: 'whole-word', text };
  }, [text]);

  const visibleItems = useMemo(() => {
    return searchItems(allItems, searchOptions);
  }, [allItems, searchOptions]);
  // ...
}

// better fix
function Dropdown({ allItems, text }) {
  const visibleItems = useMemo(() => {
    const searchOptions = { matchMode: 'whole-word', text };
    return searchItems(allItems, searchOptions);
  }, [allItems, text]);
  // ...
}
```

### Memoizing a function

```ts
function ProductPage({ productId, referrer }) {
  // 和对象一样，每次组件渲染时，这个函数都会重新声明，每一次渲染都是一个新的函数
  // 由于Form是被memo包裹的，当这个函数不变时是不会重新渲染的
  function handleSubmit(orderDetails) {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails
    });
  }

  // 假设这个Form组件是包裹在一个memo内的，这是传递了一个函数给它
  return <Form onSubmit={handleSubmit} />;
}


// fix
function Page({ productId, referrer }) {
  // 将这个函数通过useMemo包裹
  const handleSubmit = useMemo(() => {
    return (orderDetails) => {
      post('/product/' + productId + '/buy', {
        referrer,
        orderDetails
      });
    };
  }, [productId, referrer]);

  return <Form onSubmit={handleSubmit} />;
}
```

## 3. Troubleshooting 

### My calculation runs twice on every re-render

>严格模式下开发环境的行为，略

### My useMemo call is supposed to return an object, but returns undefined

>JS箭头函数返回对象的简写语法问题，略

### Every time my component renders, the calculation in useMemo re-runs

>确保是否写了依赖项数组，略

### I need to call useMemo for each list item in a loop, but it’s not allowed

>不能在循环中直接调用`Hooks`

```ts
function ReportList({ items }) {
  return (
    <article>
      {items.map(item => {
        // You can't call useMemo in a loop like this:
        const data = useMemo(() => calculateReport(item), [item]);
        return (
          <figure key={item.id}>
            <Chart data={data} />
          </figure>
        );
      })}
    </article>
  );
}

// fix
function ReportList({ items }) {
  return (
    <article>
      {items.map(item =>
        <Report key={item.id} item={item} />
      )}
    </article>
  );
}

// 把Report提取出来作为一个组件，缓存每一次的计算结果
function Report({ item }) {
  // Call useMemo at the top level:
  const data = useMemo(() => calculateReport(item), [item]);
  return (
    <figure>
      <Chart data={data} />
    </figure>
  );
}

// better fix
function ReportList({ items }) {
  // ...
}

// 直接缓存Report组件，当依赖项item没有发生变化时跳过重新渲染
const Report = memo(function Report({ item }) {
  const data = calculateReport(item);
  return (
    <figure>
      <Chart data={data} />
    </figure>
  );
});
```

## 4. 一句话总结用法

>`useMemo`接受两个参数，第一个参数是函数，会调用这个函数然后把其返回值缓存起来，第二个参数是依赖项数组(确保这些依赖在这个函数中使用)，`React`通过`Object.is`去比较依赖项的变化，如果没有发生变化，缓存的结果和上次渲染期间是相同的；否则会重新调用这个函数，获取最新的返回值缓存起来。

## useRef

// todo