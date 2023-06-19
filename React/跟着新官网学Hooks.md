# Hooks系列

文档目录结构保持和官方文档一致，例子全部来自官网。

## [useCallback](https://react.dev/reference/react/useCallback)

>在组件重新渲染之间缓存一个函数（需要配合`memo`使用

```ts
const cacheFn = useCallback(fn, dependencies)
```

## 1.Reference

### Parameters

- `fn`：需要缓存的函数，可以接收任意个数的参数以及返回任意类型的值。在组件首次渲染期间，`React`会返回这个函数（不会调用它），下一次渲染时，当依赖性没有发生变化，`React`会再一次返回这个相同的函数。

- `dependencies`：`fn`中使用的所有响应值的列表，响应值包含`props`、`state`以及所有变量，函数声明包含在组件内部的。依赖性列表必须具体恒定数量的项，`React`将使用`Object.is`比较每个依赖性与其先前的值

### Returns

>在组件首次渲染期间，`useCallback`返回传递的函数；在之后的渲染中，它要么返回在上一次渲染中存储的函数，要么返回一个在当前渲染期间传递的函数（新的函数）

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

  useEffect(() => {
    // 这里有个问题，每个在函数中使用的响应值都必须声明为Effect的依赖项
    // 然而如果声明了createOptions作为依赖项，这会造成不断重新连接这个chat room
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

## 4. 一句话总结用法
>`useContext`是一种提供跨组件通信方式的Hook，需要配合`createContext`使用，通过`createContext`创建一个上下文，然后用它返回的上下文对象的`provider`包裹需要接收上下文的所有组件，在这些组件中使用`useContext`就可以获取到传递上下文的值。当上下文的值发生改变时，所有使用的组件都会触发重新渲染。


## [useEffect](https://react.dev/reference/react/useEffect)

>在组件中执行副作用。（浏览器绘制屏幕之后）

```ts
useEffect(setup, dependencies)
```

## 1. Reference

### Parameters

- `setup function`：一个带有副作用逻辑的函数，这个函数可以返回一个清理函数（清除副作用）。当组件被添加进`DOM`时，`React`会调用setup function，在之后的每次渲染并改变依赖项后也会调用；`React`首先会调用带有旧状态的清理函数（如果有提供），然后调用带有新状态的setup function；当组件从`DOM`移除时，也会调用清理函数。

- `optional dependencies`：（一个依赖项数组）所有在setup function中引用的响应值列表，包含`props`、`state`和所有变量、函数声明在组件内部的。`React`会使用`Object.is`比较每一项依赖，如果没有传依赖项数组，setup function将会在每一次重新渲染后重新执行。

### Returns
>`useEffect`没有返回值（undefined）。

### Caveats

- 只能在组件的顶层作用域中调用，不能在循环，条件语句中。
- 如果不需要去执行一些副作用操作时，不要使用`Effect`。
- 当严格模式中，`React`会额外调用一次setup和cleanup（副作用函数和清除副作用函数）在第一次调用setup前
- 如果依赖项是定义在组件内部的对象或者函数时，可能会造成`Effect`频繁的执行，为了修复这个问题，可以移除非必要的对象或函数依赖。
- 如果`Effect`不是由交互引起的，`React`会先绘制屏幕更新在执行`Effect`之前，如果`Effect`是在做一些视觉上的事情，并且有明显延迟，用`useLayoutEffect`代替。
- 即使`Effect`是由交互引起的，浏览器也可能在`Effect`中的状态更新前重新绘制屏幕，如果必须阻塞浏览器重新绘制屏幕，使用`useLayoutEffect`代替。
- `Effect`只运行在客户端，在服务端渲染期间不会执行。


## 2. Usage

### Connecting to an external system

>`React`在必要时调用副作用函数和清理函数，这可能发生多次

- 当组件挂载时执行一次副作用函数。
- 依赖项发生变化后每次重新渲染期间，先执行一次清理函数，再执行一次副作用函数。
- 组件从页面中移除时，执行一次清理函数

```ts
import { useEffect } from 'react';
import { createConnection } from './chat.js';

function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  // 接收两个参数，一个副作用函数，一个依赖项数组
  useEffect(() => {
  	const connection = createConnection(serverUrl, roomId);
    connection.connect();
  	return () => {
      connection.disconnect();
  	};
  }, [serverUrl, roomId]);
  // ...
}
```

### Wrapping Effects in custom Hooks

>为组件所依赖的常见行为提取一些自定义`Hooks`。

```ts
function useChatRoom({ serverUrl, roomId }) {
  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId
    };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]);
}

function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');
  // 把聊天室的连接封装成一个自定义Hook
  useChatRoom({
    roomId: roomId,
    serverUrl: serverUrl
  });
  // ...
}
```

### Controlling a non-React widget
>有些时候，如果希望外部系统和组件内部的状态同步，可以不需要清理函数。

### Fetching data with Effects
>可以使用Effect为组件去请求网络数据。

```ts
import { useState, useEffect } from 'react';
import { fetchBio } from './api.js';

export default function Page() {
  const [person, setPerson] = useState('Alice');
  const [bio, setBio] = useState(null);

  useEffect(() => {
    // 这个布尔值的作用是避免person更新后，请求竞态（例如第一个请求比第二个请求慢）
    let ignore = false;
    setBio(null);
    // 请求网络数据 
    fetchBio(person).then(result => {
      if (!ignore) {
        setBio(result);
      }
    });
    return () => {
      ignore = true;
    };
  }, [person]);

  // ...
}
```

### Specifying reactive dependencies

>任何使用在`Effect`中的响应值都必须作为一个依赖声明。当依赖性是一个空数组时，组件的`props`和`state`改变了也不会重新执行，如果没有传递依赖性数组，每次组件重新渲染期间，`Effect`都会重新执行。

```ts
function ChatRoom({ roomId }) { // This is a reactive value
  const [serverUrl, setServerUrl] = useState('https://localhost:1234'); // This is a reactive value too

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // This Effect reads these reactive values
    connection.connect();
    return () => connection.disconnect();
  }, [serverUrl, roomId]); // So you must specify them as dependencies of your Effect
  // ...
}

// 在配置了正确的linter时，如果尝试移除serverUrl和roomId，React会抛出一个错误
function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');
  
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, []); // React Hook useEffect has missing dependencies: 'roomId' and 'serverUrl'
  // ...
}

// 如果想要移除一个依赖，需要证明这个依赖不是必须的
// 这个serverUrl在组件重新渲染后也不会改变
const serverUrl = 'https://localhost:1234'; // Not a reactive value anymore

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // All dependencies declared
  // ...
}


// 如果Effect没有使用任何响应值，这个依赖项数组应该是空的
const serverUrl = 'https://localhost:1234'; // Not a reactive value anymore
const roomId = 'music'; // Not a reactive value anymore

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, []); // All dependencies declared
  // ...
}
```

### Updating state based on previous state from an Effect

>当需要在`Effect`中基于上一次状态来更新状态。

```ts
function Counter() {
  const [count, setCount] = useState(0);
  // 这会导致，每一次count改变，Effect都重新执行
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount(count + 1); // You want to increment the counter every second...
    }, 1000)
    return () => clearInterval(intervalId);
  }, [count]); //  ... but specifying `count` as a dependency always resets the interval.
  // ...
}


// fix
export default function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount(c => c + 1); // Pass a state updater
    }, 1000);
    return () => clearInterval(intervalId);
  }, []); // Now count is not a dependency

  return <h1>{count}</h1>;
}
```

### Removing unnecessary object dependencies 

>如果`Effect`依赖的是一个对象或者函数（在渲染期间创建的），这可能会造成Effect频繁执行。

```ts
const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  const options = { // This object is created from scratch on every re-render
    serverUrl: serverUrl,
    roomId: roomId
  };

  useEffect(() => {
    const connection = createConnection(options); // It's used inside the Effect
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // 🚩 As a result, these dependencies are always different on a re-render
  // ...
}

// fix
// 避免使用一个在渲染期间创建的对象作为依赖，取而代之的是把这个对象的创建写入Effect
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const options = { 
      serverUrl: serverUrl,
      roomId: roomId
    };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);
  // ...
}
```

### Removing unnecessary function dependencies

- 同上，略。

### Reading the latest props and state from an Effect

- 引出`useEffectEvent`，略

### Displaying different content on the server and the client

>如果应用使用服务端渲染，你的组件将渲染在两个不同的环境，在服务端，它将会渲染初始的`HTML`，在客户端，`React`将会再一次执行渲染代码，以便将事件处理附加到`HTML`。

```ts
function MyComponent() {
  const [didMount, setDidMount] = useState(false);

  useEffect(() => {
    setDidMount(true);
  }, []);

  if (didMount) {
    // ... return client-only JSX ...
  }  else {
    // ... return initial JSX ...
  }
}
```


## 3. Troubleshooting

### My Effect runs twice when the component mounts
>当严格模式开启时，在开发环境中，`React`会额外运行一次setup和cleanup。

### My Effect runs after every re-render
>检查是否没有传递依赖数组，如果有传递依赖数组，可能是这些依赖在每次渲染期间都是不同的。

### My Effect keeps re-running in an infinite cycle 
>`Effect`更新了状态，这个造成`Effect`依赖改变的状态又触发了重新渲染。

### My cleanup logic runs even though my component didn’t unmount 
>清理函数不仅仅是在组件从`DOM`中移除时触发，在每一次依赖改变后重新渲染前也会触发。

### My Effect does something visual, and I see a flicker before it runs 

>如果`Effect`需要在浏览器渲染屏幕前执行，用`useLayoutEffect`代替。

## 4. 一句话总结用法
>`useEffect`用于在组件中执行副作用，它接收两个参数，一个是副作用函数，这个函数可以返回另一个清理函数（清除副作用产生的影响），`React`会在这个副作用函数重新执行前先执行这个清理函数；第二个参数是依赖项数组，当依赖性发生变化时，`React`会重新执行副作用函数，当依赖性数组为空时，副作用函数在整个组件生命周期中只执行一次，当没有传递依赖性数组时，每次组件重新渲染期间，`React`都会重新执行这个副作用函数。

## [useImperativeHandle](https://react.dev/reference/react/useImperativeHandle)

>它可以自定义由`ref`暴露出来的内容。

```ts
useImperativeHandle(ref, createHandle, dependencies?)
```

## 1. Reference

### Parameters

- `ref`：从`forwardRef`渲染函数中获得的第二个参数。
- `createHandle`：一个没有任何参数的函数，它返回一个你想暴露的方法（各种属性）的对象。
- `dependencies`：略，同`useEffect`的`dependencies`。

### Returns

>`useImperative`没有返回值。

## 2. Usage

### Exposing a custom ref handle to the parent component 

>默认情况下，函数式组件无法暴露`DOM`节点给父组件，需要使用`forwardRef`转发。

```ts
import { forwardRef } from 'react';

// MyInput的ref会接收input DOM节点
const MyInput = forwardRef(function MyInput(props, ref) {
  return <input {...props} ref={ref} />;
});


// 可以通过useImperativeHandle修改MyInput暴露出去的ref
import { forwardRef, useImperativeHandle } from 'react';

const MyInput = forwardRef(function MyInput(props, ref) {
  useImperativeHandle(ref, () => {
    return {
      // 自定义暴露内容
    };
  }, []);

  return <input {...props} />;
});

// 比如不想暴露出整个input DOM节点，只想要它其中的两个方法，focus和scrolltoView
import { forwardRef, useRef, useImperativeHandle } from 'react';

const MyInput = forwardRef(function MyInput(props, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => {
    return {
      focus() {
        inputRef.current.focus();
      },
      scrollIntoView() {
        inputRef.current.scrollIntoView();
      },
    };
  }, []);

  return <input {...props} ref={inputRef} />;
});
```

### Exposing your own imperative methods

>自定义暴露出来的方法不一定要匹配DOM节点的方法，可以自定义内容。

```ts
import { forwardRef, useRef, useImperativeHandle } from 'react';

const CommentList = forwardRef(function CommentList(props, ref) {
  const divRef = useRef(null);

  useImperativeHandle(ref, () => {
    return {
      // 滚动到底部
      scrollToBottom() {
        const node = divRef.current;
        node.scrollTop = node.scrollHeight;
      }
    };
  }, []);

  let comments = [];
  for (let i = 0; i < 50; i++) {
    comments.push(<p key={i}>Comment #{i}</p>);
  }

  return (
    <div className="CommentList" ref={divRef}>
      {comments}
    </div>
  );
});
```

## 3. 一句话总结用法

>`useImperativeHandle`用于通过`ref`暴露自定义的内容，接收三个参数，第一个参数是`forwardRef`中的第二参数，第二个是函数`createHandle`，该函数返回的对象就是暴露出去的内容，第三个参数是一个依赖项数组，控制`createHandle`是否重新执行。

## [useInsertionEffect](https://react.dev/reference/react/useInsertionEffect)

>它是`useEffect`的一个版本，在DOM改变之前触发副作用。

```ts
useInsertionEffect(setup, dependencies?)
```

## 1. Reference

### Parameters 

- 略，参照useEffect。

### Returns
>`useInsertionEffect`没有返回值。

### Caveats

- 仅仅在客户端执行，不会在服务端渲染期间执行。
- 不能在`useInsertionEffect`内部更新状态。
- 在运行时，`ref`还没被附加到`组件/DOM`上，`DOM`也还没更新。

## 2. Usage

### Injecting dynamic styles from CSS-in-JS libraries
>传统下，可以使用纯`CSS`为`React`组件设计样式，有些团队更喜欢直接在`JS`代码中设置样式。这通常需要使用`CSS-in-JS`的库或者工具。

- 通过编译器静态提取CSS文件
- 行内样式，例如`<div style={{ opacity: 1 }}>`（可以使用`useInsertionEffect`解决
- 运行时注入`style`标签（不被推荐

```ts
// 调用useInsertionEffect在DOM更新前插入样式
// Inside your CSS-in-JS library
let isInserted = new Set();
function useCSS(rule) {
  useInsertionEffect(() => {
    // As explained earlier, we don't recommend runtime injection of <style> tags.
    // But if you have to do it, then it's important to do in useInsertionEffect.
    if (!isInserted.has(rule)) {
      isInserted.add(rule);
      document.head.appendChild(getStyleForRule(rule));
    }
  });
  return rule;
}

function Button() {
  const className = useCSS('...');
  return <div className={className} />;
}

// --------------------
// 如果需要在服务端渲染期间收集CSS rules
let collectedRulesSet = new Set();

function useCSS(rule) {
  if (typeof window === 'undefined') {
    collectedRulesSet.add(rule);
  }
  useInsertionEffect(() => {
    // ...
  });
  return rule;
}
```

## 3. 一句话总结用法
>和`useEffect`近乎一致，唯一的区别在于副作用函数执行的时机在`DOM`改变前，通常用于为`DOM`注入样式。



## [useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)

>它是`useEffect`的一个版本，在浏览器重新绘制屏幕之前触发副作用。


```ts
useLayoutEffect(setup, dependencies?)
```

## 1. Reference

### Parameters

- 略，参照useEffect。

### Returns
>`useLayoutEffect`没有返回值。

### Caveats

- 在组件的顶层作用域中调用，不能在循环或者条件语句中调用。
- 当严格模式中，`React`会额外调用一次setup和cleanup（副作用函数和清除副作用函数）在第一次调用setup前。
- 如果你的依赖项是定义在组件内部的对象或者函数，可能会造成副作用函数多次调用，为了修复这个问题，移除不必要的对象和函数依赖。
- `Effect`只在客户端运行，在服务端渲染期间不会允许。
- 在`useLayout`内部的所有状态更新都会阻塞浏览器绘制屏幕，可能会导致应用缓慢，尽可能推荐使用`useEffect`。

## 2. Usage

### Measuring layout before the browser repaints the screen

>大多数组件都不需要在渲染时知道它们在屏幕中的定位和尺寸，它们仅仅返回`JSX`，浏览器计算它们的布局绘制屏幕。

```ts
// 这个例子中需要在浏览器绘制屏幕前，获取到元素的高度
function Tooltip() {
  const ref = useRef(null);
  const [tooltipHeight, setTooltipHeight] = useState(0); // You don't know real height yet

  useLayoutEffect(() => {
    const { height } = ref.current.getBoundingClientRect();
    setTooltipHeight(height); // Re-render now that you know the real height
  }, []);

  // ...use tooltipHeight in the rendering logic below...
}
```

## 3. Troubleshooting 

### I’m getting an error: ”useLayoutEffect does nothing on the server”

>`useLayoutEffect`的目的是为了让你的组件使用布局信息进行渲染。但在使用服务端渲染时，渲染初始内容是在`JS`代码执行之前，这会导致读不到布局信息。

- 渲染初始内容
- 在浏览器绘制屏幕前测量布局
- 使用读到的布局信息渲染最后内容


## 4. 一句话总结用法
>和`useEffect`近乎一致，唯一的区别在于`useLayoutEffect`执行副作用函数时会阻塞浏览器渲染，在浏览器绘制屏幕之前执行。


## [useMemo](https://react.dev/reference/react/useMemo)

>在组件重新渲染之间缓存计算结果。（由于每一次状态更新都会导致组件重新渲染

```ts
const cachedValue = useMemo(calculateValue, dependencies)
```

## 1. Reference

### Parameters

- `calculateValue`：需要缓存值的计算函数，它必须是纯函数，没有任何参数，返回一个任意类型的值。`React`将会调用这个函数在首次渲染期间，在下次渲染时`React`将会返回相同的结果（如果`dependencies`在上一次渲染后没有任何变化），否则`React`将再次调用这个`calculateValue`拿到最新的返回结果进行缓存

- `dependencies`：在`calculateValue`中使用的所有响应值的列表，响应值包含`props`、`state`以及所有变量，函数声明包含在组件内部的。依赖性列表必须具体恒定数量的项，`React`将使用`Object.is`比较每个依赖性与其先前的值

### Returns
>在组件首次渲染中，`useMemo`的返回值是`calculateValue`调用后的返回值;在下一个渲染期间，它要么是上次渲染缓存的值，要么是再次调用`calculateValue`的返回值。

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

## [useReducer](https://react.dev/reference/react/useReducer)

>给组件添加一个`reducer`。

```ts
const [state, dispatch] = useReducer(reducer, initialArg, init?)
```

## 1. Reference

### Parameters

- `reducer`：指定如何更新状态的`reducer`函数，必须是纯函数，接收`state`和`action`作为参数，需要返回下一个`状态`,  `state`和`action`可以是任意类型。

- `initialArg`：计算状态的初始值，可以是任意类型，如何从它计算初始值取决于下一个参数`init`。

- `init`：初始化函数，需要返回一个初始状态，如果没有传入这个初始化函数，那么初始状态就是`initialArg`，否则初始状态就是`init(initialArg)`的调用结果（返回值。

### Returns

>`useReducer`返回一个数组，带有两个特殊的值。

- `current state`：在组件首次渲染期间被设置为`init(initialArg)`或者`initialArg`（没有init）


## [useRef](https://react.dev/reference/react/useRef)

>引用一个不需要渲染的值。

```ts
const ref = useRef(initialValue)
```

## 1. Reference

### Parameters

- `initialValue`：ref对象的`current`属性的初始值，可以是任意类型，会在首次渲染之后被忽略。

### Returns
>返回一个对象只有一个`current`属性。这个`current`属性初始值是传递的`initialValue`，之后可以把它设置成其他值。如果把ref对象作为`JSX`的`ref`属性传递给`React`，`React`会为它设置`current`属性。

### Caveats

- 可以修改`ref.current`属性，它是可变的，如果把它用于渲染，就不该修改它。
- 改变`ref.current`属性不会触发`React`重新渲染。
- 不要写入和读取`ref.current`在渲染期间（除了首次渲染）。
- 严格模式下的开发环境行为，略

## 2. Usage 

### Referencing a value with a ref 

>`useRef`返回一个具有单个`current`属性 的`ref`对象，并初始化为你提供的`initial value`，在之后的渲染中都是同一个对象（持久化），改变ref不会触发重新渲染

- 可以在重新渲染期间存储信息（不像普通对象，每次渲染都会重置），引用的值被持久化。
- 改变它不会触发重新渲染（不像`state`，会触发重新渲染）

```ts
import { useRef } from 'react';

export default function Counter() {
  // 记录按钮点击的次数，由于不用于组件渲染，可以不使用state
  let ref = useRef(0);

  function handleClick() {
    ref.current = ref.current + 1;
    alert('You clicked ' + ref.current + ' times!');
  }

  return (
    <button onClick={handleClick}>
      Click me!
    </button>
  );
}
```

### Manipulating the DOM with a ref

>通过`ref`操作`DOM`是非常常见的，`React`内置了对它的支持。

```ts
import { useRef } from 'react';

export default function Form() {
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current.focus();
  }

  return (
    <>
      // 将这个ref对象传递给操作节点的ref属性
      <input ref={inputRef} />
      <button onClick={handleClick}>
        Focus the input
      </button>
    </>
  );
}
```

Examples of manipulating the DOM with useRef

```ts
import { forwardRef, useRef } from 'react';

// 通过forwardRef向父组件暴露ref
const MyInput = forwardRef((props, ref) => {
  return <input {...props} ref={ref} />;
});

export default function Form() {
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current.focus();
  }

  return (
    <>
      <MyInput ref={inputRef} />
      <button onClick={handleClick}>
        Focus the input
      </button>
    </>
  );
}
```

### Avoiding recreating the ref contents
>`React`会保存首次的ref初始值，并在后续渲染中忽视它。

```ts
function Video() {
  // 这里new VideoPlayer的结果只会在首次渲染时使用，但是每次渲染都会调用这个方法
  const playerRef = useRef(new VideoPlayer());
  // ...
}

// fix
function Video() {
  const playerRef = useRef(null)
  // 通常在渲染期间写入和读取current是不被允许的，但这种情况下可以
  // 条件只在初始化渲染时执行，行为是可预测的
  if (playerRef.current === null) {
    playerRef.current = new VideoPlayer()
  }
}
```

## 3. Troubleshooting 

### I can’t get a ref to a custom component 

>无法在函数式组件上直接使用`ref`。

```ts
import { forwardRef } from 'react';

// 可以通过forwardRef，把ref转发到组件内部的DOM节点上
const MyInput = forwardRef(({ value, onChange }, ref) => {
  return (
    <input
      value={value}
      onChange={onChange}
      ref={ref}
    />
  );
});

const inputRef = useRef(null);

return <MyInput ref={inputRef} />;
```

## 4. 一句话总结用法
>`useRef`可以持久化的保存一个值或者是一个`DOM节点`，`React元素`，它接收一个参数，这个参数在首次渲染期间会传递给它返回`ref对象`的`current`属性，`current`属性是可修改的，修改它不会触发`React`重新渲染。

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

>`useState`接受两个参数，第一个是状态的初始值，如果初始值是函数，会在组件首次渲染期间调用这个函数，并将其返回值存储起来；第二个参数是更新状态的函数，这个更新函数调用时，传递的参数如果是函数会接收到上一次状态的值，然后将其调用结果作为新的状态更新。

## [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)

todo

## [useTransition](https://react.dev/reference/react/useTransition)

todo