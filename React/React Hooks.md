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

- 只能在组件的顶层作用域中或者自定义Hook中调用，不能在循环和条件语句中调用
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


## [useDebugValue](https://react.dev/reference/react/useDebugValue)

>用于在自定义Hook加标签（`DevTools`调试。

```ts
useDebugValue(value, format?)
```

## 1. Reference

### Parameters

- `value`：在`DevTools`中显示的值，可以是任意类型。

- `format`：一个格式化函数，`DevTools`会把`value`作为参数调用这个函数，然后显示返回的格式化值（可以是任意类型）如果没有指定这个函数，则会显示`value`。

### Returns

>`useDebugValue`没有返回值。

## 2. Usage

### Adding a label to a custom Hook

>在自定义Hook中调用`useDebugValue`，可以在开发工具显示只读的调试值。

```ts
import { useDebugValue } from 'react';

function useOnlineStatus() {
  // ...
  useDebugValue(isOnline ? 'Online' : 'Offline');
  // ...
}
```

### Deferring formatting of a debug value 

>可以传递一个格式化函数作为`useDebugValue`。

```ts
// 这个格式化函数接收useDebugValue的第一个参数
useDebugValue(date, date => date.toDateString());
```

## 3. 一句话总结用法

>`useDebugValue`可以给自定义`Hook`打标签，方便`React`开发工具调试`Hook`。接受两个参数，第一个是需要显示的值`value`，第二个是接受`value`作为参数的格式化函数`format function`，返回值会代替`value`；如果没有传递`format function`，显示的值是`value`。


## [useDeferredValue](https://react.dev/reference/react/useDeferredValue)

>用于延迟更新视图的一部分。（延迟更新某个值的渲染

```ts
const deferredValue = useDeferredValue(value)
```

## 1. Reference

### Parameters

- `value`：想要延迟的值，可以是任意类型。

### Returns

>在初始渲染期间，这个返回的延迟值就是传递给`useDeferredValue`的参数，在之后更新期间，`React`会首先尝试用旧值渲染，然后用新值在后台重新渲染。

### Caveats

- 传递给`useDeferredValue`的值应该是原始值（像数值，字符串）或者是在渲染之外创建的对象，如果是在渲染期间创建的对象，那么这个对象在每次渲染期间都是不同的。

- 当`useDeferredValue`接收到一个不同的值时（`Object.is`比较），除了当前渲染（仍然使用旧值），还会在后台安排一个带有新值的重新渲染，后台的渲染是可中断的，如果有另外一个更新的值，`React`将重新开始后台渲染。

- `useDeferredValue`和`<Suspense>`整合在一起时，如果由新值引起的后台更新挂起了UI（等待渲染到屏幕），用户将看不到`<Suspense>`的`fallback`，他们将看到延迟的旧值直到数据加载。

- `useDeferredValue`不会阻止额外的网络请求。

- `useDeferredValue`本身没有引起固定的延迟，一旦`React`完成了旧值的重新渲染，就会立即在后台用新的延迟值重新渲染。任何由事件引起的更新都会中断后台重新渲染，并优先于它。

- 由`useDeferredValue`引起的后台渲染在提交到屏幕前不会触发影响，当后台渲染挂起时，它的影响将在数据加载和UI更新后运行。

## 2. Usage

### Showing stale content while fresh content is loading

>配合`Suspense`使用的例子。


```ts
// 这个例子中，每次请求搜索数据时，都会先显示loading...
export default function App() {
  const [query, setQuery] = useState('');
  return (
    <>
      <label>
        Search albums:
        <input value={query} onChange={e => setQuery(e.target.value)} />
      </label>
      <Suspense fallback={<h2>Loading...</h2>}>
        <SearchResults query={query} />
      </Suspense>
    </>
  );
}

// 使用useDeferredValue
export default function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  return (
    <>
      <label>
        Search albums:
        <input value={query} onChange={e => setQuery(e.target.value)} />
      </label>
      // 重新搜索数据时，不会看到fallback，而是看到旧的结果直到新的结果完成加载
      <Suspense fallback={<h2>Loading...</h2>}>
        <SearchResults query={deferredQuery} />
      </Suspense>
    </>
  );
}
```

### Indicating that the content is stale

>上面例子中，感知不到最新查询的结果列表仍在加载，如果加载需要一段时间，可能会导致用户困惑，为了让用户更清楚地看到结果列表与最近的查询不匹配，可以添加一个可视化的展示效果。

```ts
import { Suspense, useState, useDeferredValue } from 'react';
import SearchResults from './SearchResults.js';

export default function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;
  return (
    <>
      <label>
        Search albums:
        <input value={query} onChange={e => setQuery(e.target.value)} />
      </label>
      <Suspense fallback={<h2>Loading...</h2>}>
        // 增加了一个过渡效果
        <div style={{
          opacity: isStale ? 0.5 : 1,
          transition: isStale ? 'opacity 0.2s 0.2s linear' : 'opacity 0s 0s linear'
        }}>
          <SearchResults query={deferredQuery} />
        </div>
      </Suspense>
    </>
  );
}
```

### Deferring re-rendering for a part of the UI

>可以使用`useDeferredValue`作为一种性能优化，当有一部分UI需要延迟重新渲染时，这是有用的。


```ts
// App组件中有个"慢"列表在每次敲击键盘时都要重新渲染
function App() {
  const [text, setText] = useState('');
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <SlowList text={text} />
    </>
  );
}

// 首先用memo包裹，跳过在props相同时重新渲染
const SlowList = memo(function SlowList({ text }) {
  // ...
});

// 然而在props不同时，需要显示不同的视觉输出时会很慢
// 这时就可以把用useDeferredValue包裹的值作为prop传递给列表
function App() {
  const [text, setText] = useState('');
  const deferredText = useDeferredValue(text);
  return (
    <>
      // useDeferredValue允许你优先更新输入(必须快)
      <input value={text} onChange={e => setText(e.target.value)} />
      // 而不是更新结果列表(允许慢一些):
      <SlowList text={deferredText} />
    </>
  );
}

// 总结：deferredText并不能使得SlowList重新呈现更快，只是告诉React，重新渲染列表
// 可以被取消优先级，这样就不会阻塞键盘输入，React将尝试重新渲染，但不会阻止用户输入
```

## 3. 一句话总结用法

>`useDeferredValue`用于延迟更新某个值的渲染，以改善页面性能。接收一个参数，返回一个要延迟的值，当这个延迟的值改变时，`React`会在空闲时间段更新它。

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

- 只能在组件的顶层作用域中或者自定义Hook中调用，不能在循环，条件语句中。
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

## [useId](https://react.dev/reference/react/useId)

>可以生成一个唯一的ID。

```ts
const id = useId()
```

## 1. Reference

### Parameters

>`useId`不接收任何参数。

### Returns

>返回一个唯一的字符串ID。

### Caveats

- 只能在组件的顶层作用域中或者自定义Hook中调用，不能在循环或条件语句中。

- 不应该被用于给列表生成`key`, `key`应该由数据生成。

## 2. Usage

### Generating unique IDs for accessibility attributes

>一个组件可能会在页面上渲染多次，但是`ID`必须是唯一的，使用`useId`生成唯一的`ID`。

```ts
import { useId } from 'react';

function PasswordField() {
  const passwordHintId = useId();
  return (
    <>
      <label>
        密码:
        <input
          type="password"
          // aria-describedby指定两个标签之间的关系
          aria-describedby={passwordHintId}
        />
      </label>
      <p id={passwordHintId}>
        密码应该包含至少 18 个字符
      </p>
    </>
  );
}

export default function App() {
  return (
    <>
      <h2>输入密码</h2>
      <PasswordField />
      <h2>验证密码</h2>
      <PasswordField />
    </>
  );
}
```

### Generating IDs for several related elements

>为多个相关元素生成`ID`，调用`useId`来为它们生成共同的前缀。

```ts
import { useId } from 'react';

export default function Form() {
  const id = useId();
  return (
    <form>
      <label htmlFor={id + '-firstName'}>名字：</label>
      <input id={id + '-firstName'} type="text" />
      <hr />
      <label htmlFor={id + '-lastName'}>姓氏：</label>
      <input id={id + '-lastName'} type="text" />
    </form>
  );
}
```

### Specifying a shared prefix for all generated IDs

>如果在单个页面上渲染多个独立的`React`应用程序，在`createRoot`或`hydrateRoot`调用中将`identifierPrefix`作为选项传递, 确保了由两个不同应用程序生成的`ID`永远不会冲突，因为使用`useId`生成的每个`ID`都将以指定的不同前缀开头。

```ts
// index.js
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './styles.css';

const root1 = createRoot(document.getElementById('root1'), {
  identifierPrefix: 'my-first-app-'
});
root1.render(<App />);

const root2 = createRoot(document.getElementById('root2'), {
  identifierPrefix: 'my-second-app-'
});
root2.render(<App />);

// App.js
import { useId } from 'react';

function PasswordField() {
  const passwordHintId = useId();
  console.log('生成的 ID：', passwordHintId)
  return (
    <>
      <label>
        密码:
        <input
          type="password"
          aria-describedby={passwordHintId}
        />
      </label>
      <p id={passwordHintId}>
        密码应该包含至少 18 个字符
      </p>
    </>
  );
}

export default function App() {
  return (
    <>
      <h2>输入密码</h2>
      <PasswordField />
    </>
  );
}
```

## 3. 一句话总结用法

>`useId`用于生成唯一的`ID`，不接收任何参数，返回生成的字符串`ID`，可以解决服务端渲染时和客户端生成的`ID`不匹配的问题。


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

>`useImperativeHandle`用于通过`ref`暴露自定义的内容，接收三个参数，第一个参数是`forwardRef`中的第二参数`ref`，第二个是函数`createHandle`，该函数返回的对象就是暴露出去的内容，第三个参数是一个依赖项数组，控制`createHandle`是否重新执行。

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

- 只能在组件的顶层作用域中或者自定义Hook中调用，不能在循环和条件语句中调用
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

- `current state`：在组件首次渲染期间被设置为`init(initialArg)`或者`initialArg`（没有init）。
- `dispatch function`：更新状态为不同的值，然后触发组件重新渲染。

### Caveats

- `useReducer`只能在组件的顶层作用域中或者自定义Hook中调用，不能在循环或者条件语句中。
- 当严格模式下，`React`会调用`reducer`初始化两次，这是开发环境下的行为。

### dispatch function

>通过`useReducer`返回的`dispatch function`可以更新状态并触发重新渲染，接收一个"行为"作为唯一的参数。

```ts
const [state, dispatch] = useReducer(reducer, { age: 42 })

function handleClick() {
  dispatch({ type: 'increment_age' })
}
```

#### Parameters

- `action`：这个`action`可以是任意类型，按照惯例，是一个带有`type`属性的对象，还可以带有其他附加属性。

#### Returns

>`dispatch function`没有返回值。

#### Caveats

- `dispatch function`仅仅更新状态为了下一次渲染，如果读取状态在调用之后，仍然会得到旧的状态。
- 如果新的状态和旧的一致（通过`Object.is`比较），`React`会跳过重新渲染。
- `React`批量更新状态，在所有的事件处理程序运行并调用它们的`set function`后更新屏幕，可以防止在一个事件中多次重新渲染，在少数情况下可能需要强制`React`尽早的更新视图，比如访问`DOM`，可以使用`flushSync`。


## 2. Usage

### Adding a reducer to a component

>`useReducer`和`useState`相似，但是它可以把状态更新逻辑移到组件外部的单个函数中。

```ts
import { useReducer } from 'react';

function reducer(state, action) {
  if (action.type === 'incremented_age') {
    // 这里需要返回一个新的状态（引用不能一致
    // state.get++
    // return state

    return {
      age: state.age + 1
    };
  }
  throw Error('Unknown action.');
}

export default function Counter() {
  const [state, dispatch] = useReducer(reducer, { age: 42 });

  return (
    <>
      <button onClick={() => {
        dispatch({ type: 'incremented_age' })
      }}>
        Increment age
      </button>
      <p>Hello! You are {state.age}.</p>
    </>
  );
}
```

### Writing the reducer function


```ts
import { useReducer } from 'react';

function reducer(state, action) {
  // 通常会写一个switch语句，在匹配的case下返回一个新的状态
  switch (action.type) {
    case 'incremented_age': {
      return {
        name: state.name,
        age: state.age + 1
      };
    }
    case 'changed_name': {
      return {
        name: action.nextName,
        age: state.age
      };
    }
  }
  // 没有匹配到case，抛出错误
  throw Error('Unknown action: ' + action.type);
}

const initialState = { name: 'Taylor', age: 42 };

export default function Form() {
  const [state, dispatch] = useReducer(reducer, initialState);

  function handleButtonClick() {
    dispatch({ type: 'incremented_age' });
  }

  function handleInputChange(e) {
    dispatch({
      type: 'changed_name',
      // 可以传递额外的数据
      nextName: e.target.value
    }); 
  }

  return (
    <>
      <input
        value={state.name}
        onChange={handleInputChange}
      />
      <button onClick={handleButtonClick}>
        Increment age
      </button>
      <p>Hello, {state.name}. You are {state.age}.</p>
    </>
  );
}
```

### Avoiding recreating the initial state 

>`React`存储初始状态一次，后续的渲染中将忽视。

```ts
function createInitialState(username) {
  // ...
}

function TodoList({ username }) {
  // 这里createInitialState(username)的结果只会被用在首次渲染，但是后面的每次渲染都会调用
  const [state, dispatch] = useReducer(reducer, createInitialState(username));
  // ...
}

// fix
function createInitialState(username) {
  // ...
}

function TodoList({ username }) {
  // 直接传入这个函数，会接收第二个useReducer的第二个参数
  const [state, dispatch] = useReducer(reducer, username, createInitialState);
}
```

## 3.Troubleshooting 

### I’ve dispatched an action, but logging gives me the old state value 

>状态像一个快照，更新状态在下一次渲染中带有新的状态，但是不会影响这个状态在已经运行的事件处理程序中。

```ts
function handleClick() {
  console.log(state.age);  // 42

  dispatch({ type: 'incremented_age' }); // Request a re-render with 43
  console.log(state.age);  // Still 42!

  setTimeout(() => {
    console.log(state.age); // Also 42!
  }, 5000);
}

// 如果想要下一次状态，可以调用reducer函数
const action = { type: 'incremented_age' };
dispatch(action);

const nextState = reducer(state, action);
console.log(state);     // { age: 42 }
console.log(nextState); // { age: 43 }
```

### I’ve dispatched an action, but the screen doesn’t update 

>如果更新的状态和上一次状态一样，`React`会忽视这次更新。

```ts
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age': {
      // Wrong: mutating existing object
      state.age++;
      return state;
    }
    case 'changed_name': {
      // Wrong: mutating existing object
      state.name = action.nextName;
      return state;
    }
    // ...
  }
}


// fix
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age': {
      // Correct: creating a new object
      return {
        ...state,
        age: state.age + 1
      };
    }
    case 'changed_name': {
      // Correct: creating a new object
      return {
        ...state,
        name: action.nextName
      };
    }
    // ...
  }
}
```

### A part of my reducer state becomes undefined after dispatching

>当返回新的状态时，确保复制已有的字段。

```ts
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age': {
      return {
        ...state, // Don't forget this!
        age: state.age + 1
      };
    }
    // ...
  }
}
```

### My entire reducer state becomes undefined after dispatching

>可能在某次case忘记返回新的状态了，如果没有匹配到任何case，可以直接抛出一个错误。

```ts
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age': {
      // ...
    }
    case 'edited_name': {
      // ...
    }
  }
  throw Error('Unknown action: ' + action.type);
}
```

### I’m getting an error: “Too many re-renders”

>不要在渲染期间更新状态。

```ts
// Wrong: calls the handler during render
return <button onClick={handleClick()}>Click me</button>

// Correct: passes down the event handler
return <button onClick={handleClick}>Click me</button>

// Correct: passes down an inline function
return <button onClick={(e) => handleClick(e)}>Click me</button>
```

### My reducer or initializer function runs twice

>是严格模式中开发环境下的默认行为。

## 4. 一句话总结用法

>`useReducer`用于组件中添加状态（类似`useState`），接收三个参数，第一个是`reducer`函数，维护状态的更新操作；第二个是一个状态的初始值`initialArg`，第三个是一个初始化函数`init`，会接收`initialArg`为参数。在首次渲染期间，如果没有传递`init`，初始状态就是`initialArg`，否则为`init`的调用结果。

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

>用于订阅外部的数据（store。

```ts
const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)
```

## 1. Reference

### Parameters

- `subscribe`：接受单个回调函数并将其订阅到`store`的函数，当`store`改变时，这个回调函数应该执行，而且会导致组件重新渲染。`subscribe function`应该返回一个取消订阅的函数。

- `getSnapshot`：从`store`中返回数据快照的函数，在`store`没有变化时，重复地调用`getSnapshot`应该返回相同的值，如果`store`改变了，返回的值是不同的，`React`将重新渲染组件。

- `getServerSnapshot`：返回`store`中数据的初始快照的函数。仅仅在服务端渲染期间和在客户端上对服务器呈现的内容进行`hydration`期间使用，这个快照必须在服务端和客户端是相同的。并且通常被序列化，然后从服务器传递到客户端，如果没有传递这个参数，在服务端渲染组件会报错。


### Returns

>返回读取到的数据快照。

### Caveats

- 通过`getSnapshot`返回的数据快照必须是不可变的，如果`store`有可更改的数据，则在数据发生变化时返回一个新的不可变快照，否则返回上次存储的快照。

- 如果一个不同的`subscribe function`在重新渲染期间被传递了，`React`将重新订阅这个`store`使用新传递的`subscribe function`，可以通过在组件外部声明订阅来防止这种情况。

## 2. Usage

### Subscribing to an external store 

>大多数`React`组件仅仅只是从它们的`props、state、context`读取数据，有些时候组件可能需要从`React`之外的存储中读取一些随时变化的数据。

```ts
// This is an example of a third-party store
// that you might need to integrate with React.

// If your app is fully built with React,
// we recommend using React state instead.
// todoStore.js
let nextId = 0;
let todos = [{ id: nextId++, text: 'Todo #1' }];
let listeners = [];

export const todosStore = {
  addTodo() {
    todos = [...todos, { id: nextId++, text: 'Todo #' + nextId }]
    emitChange();
  },
  subscribe(listener) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  getSnapshot() {
    return todos;
  }
};

function emitChange() {
  for (let listener of listeners) {
    listener();
  }
}

// App.js
import { useSyncExternalStore } from 'react';
import { todosStore } from './todoStore.js';

export default function TodosApp() {
  const todos = useSyncExternalStore(todosStore.subscribe, todosStore.getSnapshot);
  return (
    <>
      <button onClick={() => todosStore.addTodo()}>Add todo</button>
      <hr />
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </>
  );
}
```

###  Subscribing to a browser API 

>另一个使用`useSyncExternalStore`的场景是订阅通过浏览器暴露出来的一些随时可能改变的数据。

```ts
import { useSyncExternalStore } from 'react';

function getSnapshot() {
  return navigator.onLine;
}

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export default function ChatIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  return <h1>{isOnline ? 'Online' : 'Disconnected'}</h1>;
}
```

### Extracting the logic to a custom Hook

>将逻辑提取到自定义Hook中，这可以在不同组件使用相同的外部`store`。

```ts
import { useSyncExternalStore } from 'react';

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  return isOnline;
}

function getSnapshot() {
  // ...
}

function subscribe(callback) {
  // ...
}
```

### Adding support for server rendering

>如果使用服务端渲染，你的`React`组件也因此会运行在浏览器环境之外去生成初始`HTML`，这在创建连接外部`store`时有一些改变：

- 无法去连接浏览器API，因为它们不存在服务端上。

- 如果去连接第三方库，需要它们的数据在服务端和客户端匹配。

```ts
// 为了解决上面的问题，可以使用第三个参数
import { useSyncExternalStore } from 'react';

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return isOnline;
}

function getSnapshot() {
  return navigator.onLine;
}

// 和getSnapshot相似，不过它仅仅运行在服务端生成HTML或客户端hydration时
function getServerSnapshot() {
  return true; // Always show "Online" for server-generated HTML
}

function subscribe(callback) {
  // ...
}
```

## 3. Troubleshooting

### I’m getting an error: “The result of getSnapshot should be cached” 

>每次调用`getSnapshot`都返回了一个新的对象。

### My subscribe function gets called after every re-render 


>`subscribe function`被定义在了组件内部，并且每次渲染都是不同的。

```ts
function ChatIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  
  // Always a different function, so React will resubscribe on every re-render
  function subscribe() {
    // ...
  }

  // ...
}

// fix
function ChatIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  // ...
}

// Always the same function, so React won't need to resubscribe
function subscribe() {
  // ...
}

function ChatIndicator({ userId }) {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  
  // Same function as long as userId doesn't change
  const subscribe = useCallback(() => {
    // ...
  }, [userId]);

  // ...
}
```

## 4.一句话总结用法

>`useSyncExternalStore`用于在组件中订阅外部的数据。接收三个参数，第一个是用于订阅`store`的`subscribe`函数，并且返回一个取消订阅的函数，第二个是`getSnapshot`函数，可以从`store`中读取数据快照，第三个参数在服务端渲染时使用，返回`store`数据的初始快照。`useSyncExternalStore`的返回值是`store`数据的快照。


## [useTransition](https://react.dev/reference/react/useTransition)

>在不阻塞UI的情况下更新状态。（状态更新分为紧急更新和过渡`transition`更新）

```ts
const [isPending, startTransition] = useTransition()
```

## 1. Reference

### Parameters

>`useTrasition`不需要任何参数。

### Returns

>返回一个由两个元素组成的数组。

- `isPending`：是否存在`pending`的`transition`。

- `startTransition function`：将状态更新标记为`transition`。

### startTransition function

>`useTransition`返回的`startTransition`函数允许将状态更新标记为`transition`状态。

```ts
function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState('about');

  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab);
    });
  }
  // ...
}
```

#### Parameters

- `scope`：一个调用一个或多个`set function`更新某些状态的函数。`React`会立即调用这个`scope`函数（不带任何参数），并将`scope`函数调用期间计划同步执行的所有状态更新标记为`transition`状态。

#### Returns

>`startTransition`没有返回值。

#### Caveats

- `useTransition`只能在组件内部或者自定义Hook内部调用，如果想在其他地方使用，独立调用`startTransition`函数。

- 只有在可以访问该状态的`set function`时，才能将更新包装为`transition`状态。如果想要对某个prop或自定义Hook值标记为`transition`，使用`useDeferredValue`。

- 传递给`startTransition`的函数必须是同步的，`React`会立即执行此函数，标记其执行期间发生的所有状态更新为`transtion`状态，异步的状态更新不会被标记为`transition`状态。

- 标记为`transition`状态的状态更新将被其他状态更新打断。

- `transition`状态更新不能用于控制文本输入。

- 如果有多个正在进行的`transition`状态，`React`目前会将它们批量处理（未来可能会删除这个限制）


## 2. Usage

### Marking a state update as a non-blocking transition

>在组件顶层作用域调用`useTransition`，将状态更新标记为非阻塞的`transition`状态。

- [例子](https://codesandbox.io/s/mffivk?file=%2FApp.js&utm_medium=sandpack)

### Updating the parent component in a transition 

>也可以通过`useTransition`调用来更新父组件的状态。

```ts
import { useTransition } from 'react';

// 选项卡按钮
export default function TabButton({ children, isActive, onClick }) {
  const [isPending, startTransition] = useTransition();
  if (isActive) {
    return <b>{children}</b>
  }
  return (
    // 点击后通过onClick prop更新父组件的状体
    <button onClick={() => {
      startTransition(() => {
        onClick();
      });
    }}>
      {children}
    </button>
  );
}
```

### Displaying a pending visual state during the transition 

>可以使用`useTransition`返回的`isPending`来向告知用户`transition`正在进行中。例如，选项卡按钮可以有个特殊视觉效果。

```ts
function TabButton({ children, isActive, onClick }) {
  const [isPending, startTransition] = useTransition();
  // ...
  if (isPending) {
    return <b className="pending">{children}</b>;
  }
  // ...
```

### Preventing unwanted loading indicators 

- 略，和上面例子相似。

### Building a Suspense-enabled router 

>如果你正在构建一个`React`框架或路由，建议将页面导航标记为`transition`效果。

- `transition`效果是可中断的，用户在等待重新渲染完成之前点击其他地方。

- `transition`效果可以防止不必要的加载指示，避免用户在导航时产生不协调的跳转。

- [例子](https://codesandbox.io/s/exderr?file=/App.js&utm_medium=sandpack)

## 3. Troubleshooting 

### Updating an input in a transition doesn’t work

>不能使用`transition`来控制输入的状态变量，因为`transition`是非阻塞的，但是响应更改事件时更新输入应该是同步的。

如果想要在输入时运行一个`transition`：

- 可以声明两个分开的状态变量，一个用于输入状态（同步更新），另一个用于在`transition`中更新的状态变量（传递给其他渲染逻辑

- 用`useDeferredValue`包裹这个状态变量，它会自动触发非阻塞的重新渲染。


```ts
const [text, setText] = useState('');
// ...
function handleChange(e) {
  // Can't use transitions for controlled input state
  startTransition(() => {
    setText(e.target.value);
  });
}
// ...
return <input value={text} onChange={handleChange} />;
```

### React doesn’t treat my state update as a transition 

>在`transition`中包装一个状态更新时，需要确保发生在`startTransition`调用阶段。

```ts
// bad
// 传递给startTransition的函数必须是同步的
startTransition(() => {
  // etting state *after* startTransition call
  setTimeout(() => {
    setPage('/about');
  }, 1000);
});

// fix
setTimeout(() => {
  startTransition(() => {
    // Setting state *during* startTransition call
    setPage('/about');
  });
}, 1000);

// bad
startTransition(async () => {
  await someAsyncFunction();
  // Setting state *after* startTransition call
  setPage('/about');
});

// fix
await someAsyncFunction();
startTransition(() => {
  // Setting state *during* startTransition call
  setPage('/about');
});
```

### I want to call useTransition from outside a component 

>不能在组件外部调用`useTransition`，在这种情况下，应该改用独立的`startTransition`方法。

### The function I pass to startTransition executes immediately

>传递给`startTransition`的函数不会被延迟执行，`React`会立即执行函数，但是在它运行期间所有安排的状态更新都会被标记为`transition`状态。

```ts
// 这段代码会立即打印1，2，3
console.log(1);
startTransition(() => {
  console.log(2);
  setPage('/about');
});
console.log(3);


// A simplified version of how React works

let isInsideTransition = false;

function startTransition(scope) {
  isInsideTransition = true;
  scope();
  isInsideTransition = false;
}

function setState() {
  if (isInsideTransition) {
    // ... schedule a transition state update ...
  } else {
    // ... schedule an urgent state update ...
  }
}
```

## 4. 一句话总结用法

>`useTransition`用于在不阻塞`UI`的情况下进行状态更新，且是可中断的。不接收任何参数，返回一个由两个元素组成的数组，第一个是`isPending`（是否有挂起的`transition`状态），第二个是`startTransition`函数，`React`会立即调用传入`startTransition`的函数，并把该函数中所有同步执行的状态更新标记为`transition`状态。