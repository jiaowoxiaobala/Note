# React APIs系列

文档目录结构保持和官方文档一致，例子全部来自官网。

## [createContext](https://react.dev/reference/react/createContext)

>用于创建一个上下文给组件提供或读取。

## 1. Reference

### Parameters 

- `defaultValue`：当包裹需要读取上下文的组件树中没有匹配的上下文时，会读取这个默认值作为上下文，如果没有任何有意义的默认值，可以指定为`null`，它是静态的，永远不会随着时间改变。

### Returns

>返回一个上下文`context`对象。上下文对象本身不包含任何信息，只表示其他组件读取或提供的那个`context`，一般来说在组件的上方使用`SomeContext.Provider`来指定context的值，并在被包裹的组件内调用`useContext`来读取。

- `SomeContext.Provider`：为包裹的组件提供上下文的值。

- `SomeContext.Consumer`：在包裹的组件中读取上下文的值。

### SomeContext.Provider

>用上下文的`provider`包裹组件，为里面的组件指定一个`context`的值。

```ts
function App() {
  const [theme, setTheme] = useState('light');
  // ...
  return (
    // 指定value的值为theme
    <ThemeContext.Provider value={theme}>
      <Page />
    </ThemeContext.Provider>
  );
}
```

#### Props

- `value`: 该值为你想传递给所有处于这个`provider`内读取该`context`的组件，无论它们处于多深的层级。`context`的值可以为任何类型。该`provider`内的组件可通过调用`useContext(SomeContext)`来获取它上面最近的`context provider`的`value`。(或者通过`context consumer`读取)

### SomeContext.Consumer 

```ts
function Button() {
  // 遗留方式 (不推荐)
  return (
    <ThemeContext.Consumer>
      {theme => (
        <button className={theme} />
      )}
    </ThemeContext.Consumer>
  );
}

// 通过useContext来读取
function Button() {
  // 推荐方式
  const theme = useContext(ThemeContext);
  return <button className={theme} />;
}
```

#### Props

- `children`: 一个函数。`React`将传入与`useContext()`相同算法确定的当前上下文的值，来调用该函数，并根据该函数的返回值渲染结果。当父组件的上下文发生变化，`React`就会重新调用该函数。

## 2. Usage 

### Creating context

>上下文使得组件能够无需通过显式传递参数的方式，将信息逐层传递。

```ts
import { createContext } from 'react';

// 调用 createContext 来创建一个或多个上下文
// 如果没有给provider传递value，则用创建时的默认值
const ThemeContext = createContext('light');
const AuthContext = createContext(null);

function App() {
  const [theme, setTheme] = useState('dark');
  const [currentUser, setCurrentUser] = useState({ name: 'Taylor' });

  // ...

  return (
    // 通过传递value给到被包裹的组件获取上下文的值
    <ThemeContext.Provider value={theme}>
      <AuthContext.Provider value={currentUser}>
        <Page />
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
```

### Importing and exporting context from a file

>可以通过`export`将创建的上下文导出，当需要不同组件读取同一个上下文时。

```ts
// Contexts.js
import { createContext } from 'react';

export const ThemeContext = createContext('light');
export const AuthContext = createContext(null);


// App.js
import { ThemeContext, AuthContext } from './Contexts.js';

function App() {
  // ...
  return (
    <ThemeContext.Provider value={theme}>
      <AuthContext.Provider value={currentUser}>
        // Page中读取上下文的值时，会向上查找组件树中最近的一个Provider
        <Page />
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
```

## 3. Troubleshooting

#### I can’t find a way to change the context value 

>创建`context`时指定的默认值永远不会改变，如果读取时没有匹配到`provider`，就会读取这个默认值。

## 4. 一句话总结用法

>`createContext`可以用于跨层级的组件通信。接收一个任意类型的值作为参数，在创建上下文时会把这个值作为默认值（永远不会改变）；返回一个`context`对象，通过`context.Provider`为包裹的组件提供上下文的值，在被包裹的组件中使用`useContext`读取这个值。

## [forwardRef](https://react.dev/reference/react/createContext)

>可以让函数组件通过ref将一个DOM节点暴露给父组件。

```ts
const SomeComponent = forwardRef(render)
```

## 1. Reference 

### Parameters

- `render`: 组件的渲染函数，`React`会调用该函数并传入父组件传递的`props`和`ref`。

### Returns 

>返回一个可以在`JSX`中渲染的`React`组件，与作为纯函数定义的`React`组件不同，`forwardRef`返回的组件还能够接收`ref`属性。（接收两个参数，一个`props`，一个`ref`）

### Caveats

- 严格模式中，在开发环境下会调用两次渲染函数。


### render function

>`forwardRef`接受一个渲染函数作为参数。`React`会使用`props`和`ref`调用该函数。

- `props`：父组件传递过来的参数。

- `ref`：父组件传递的`ref`属性（可以是一个对象或函数），如果父组件没有传递，则为`null`，可以把这个`ref`转发给另一个组件，或者传递给`useImperativeHandle`。

```ts
const MyInput = forwardRef(function MyInput(props, ref) {
  return (
    <label>
      {props.label}
      <input ref={ref} />
    </label>
  );
});
```

## 2. Usage 

### Exposing a DOM node to the parent component

>把子组件的`DOM`节点暴漏给父组件。

```ts
// App.js
import { useRef } from 'react';
import MyInput from './MyInput.js';

export default function Form() {
  // 创建一个ref
  const ref = useRef(null);

  function handleClick() {
    ref.current.focus();
  }

  return (
    <form>
      // 把ref传递给子组件MyInput
      <MyInput label="Enter your name:" ref={ref} />
      <button type="button" onClick={handleClick}>
        Edit
      </button>
    </form>
  );
}

// MyInput.js
import { forwardRef } from 'react';

// forwardRef接收父组件传递过来的ref
const MyInput = forwardRef(function MyInput(props, ref) {
  const { label, ...otherProps } = props;
  return (
    <label>
      {label}
      // 再转发给DOM节点input
      <input {...otherProps} ref={ref} />
    </label>
  );
});
```

### Forwarding a ref through multiple components 

>可以在多个组件中转发`ref`。

```ts
// App.js
import { useRef } from 'react';
import FormField from './FormField.js';

export default function Form() {
  const ref = useRef(null);

  function handleClick() {
    ref.current.focus();
  }

  return (
    <form>
      // 把ref传递给FormField
      <FormField label="Enter your name:" ref={ref} isRequired={true} />
      <button type="button" onClick={handleClick}>
        Edit
      </button>
    </form>
  );
}

// FormFieLd.js
import { forwardRef, useState } from 'react';
import MyInput from './MyInput.js';

// 接收父组件传递的ref
const FormField = forwardRef(function FormField({ label, isRequired }, ref) {
  const [value, setValue] = useState('');
  return (
    <> 
     // 再转发给子组件MyInput
      <MyInput
        ref={ref}
        label={label}
        value={value}
        onChange={e => setValue(e.target.value)} 
      />
      {(isRequired && value === '') &&
        <i>Required</i>
      }
    </>
  );
});

// MyInput.js
import { forwardRef } from 'react';

// 接收父组件传递的ref
const MyInput = forwardRef((props, ref) => {
  const { label, ...otherProps } = props;
  return (
    <label>
      {label}
      <input {...otherProps} ref={ref} />
    </label>
  );
});
```

### Exposing an imperative handle instead of a DOM node 

>使用`useImperativeHandle`来自定义`ref`暴露的内容，而不是暴漏整个`DOM`节点。

```ts
import { forwardRef, useRef, useImperativeHandle } from 'react';

const MyInput = forwardRef(function MyInput(props, ref) {
  const inputRef = useRef(null);

  // 返回的对象为自定义暴露的内容
  useImperativeHandle(ref, () => {
    // 父组件传递的ref中，只有focus和scrollIntoView两个方法
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

## 3. Troubleshooting 

### My component is wrapped in forwardRef, but the ref to it is always null 

>可能忘记使用接收到的`ref`了，或者某些有条件的逻辑中。

```ts
const MyInput = forwardRef(function MyInput({ label, showInput }, ref) {
  return (
    <label>
      {label}
      // 如果showInput为false，ref将不会被转发到任何节点
      {showInput && <input ref={ref} />}
    </label>
  );
});
```

## 4. 一句话总结用法

>`forwardRef`用于解决无法直接在函数组件上使用`ref`的问题。接收一个函数组件参数，会给这个函数组件额外传递一个`ref`属性（除了`props`属性），在该函数组件中可以转发`ref`到其他组件或`DOM`节点，也可以通过`useImperativeHandle`自定义`ref`暴露的内容。

## [lazy](https://react.dev/reference/react/lazy)

>用于延迟加载组件的代码直到组件第一次渲染之前。

```ts
const SomeComponent = lazy(load)
```

## 1. Reference

### Parameters

- `load`: 一个返回`Promise`或者类`Promise`对象的函数。在第一次渲染返回的组件前，`React`是不会调用`load`函数的。`React`在首次调用后，会等待其解析，然后将解析值渲染成组件。返回的`Promise`和 `Promise`的解析值都将被缓存，因此`React`不会多次调用`load`函数。如果`Promise`被拒绝，则`React`将抛出拒绝原因给最近的错误边界处理。

### Returns

>返回一个`React`组件，可以渲染在组件树中，当懒加载组件的代码仍在加载时，尝试渲染它将会处于暂停状态。使用`<Suspense>`可以在其加载时显示一个正在加载的提示。

### Load function

#### Parameters

>`load function`不接收任何参数。

#### Returns

>返回一个`Promise`或者`类Promise`对象，它最终需要解析成`React`组件。

## 2. Usage

### Lazy-loading components with Suspense

>通过`lazy`实现按需加载，配合`Suspense`指定加载时的显示。

```ts
import { useState, Suspense, lazy } from 'react';
import Loading from './Loading.js';

// 添加一个固定的延迟时间，以便你可以看到加载状态
function delayForDemo(promise) {
  return new Promise(resolve => {
    setTimeout(resolve, 2000);
  }).then(() => promise);
}

const MarkdownPreview = lazy(() => delayForDemo(import('./MarkdownPreview.js')));

export default function MarkdownEditor() {
  const [showPreview, setShowPreview] = useState(false);
  const [markdown, setMarkdown] = useState('Hello, **world**!');
  return (
    <>
      <textarea value={markdown} onChange={e => setMarkdown(e.target.value)} />
      <label>
        <input type="checkbox" checked={showPreview} onChange={e => setShowPreview(e.target.checked)} />
        Show preview
      </label>
      <hr />
      // 如果MarkdownPreview 还没加载完，会显示loading
      {showPreview && (
        <Suspense fallback={<Loading />}>
          <h2>Preview</h2>
          <MarkdownPreview markdown={markdown} />
        </Suspense>
      )}
    </>
  );
}
```

## 3. Troubleshooting 

### My lazy component’s state gets reset unexpectedly 

>不要在组件内部声明`lazy`组件。

```ts
import { lazy } from 'react';

function Editor() {
  // Bad: 这将导致在重新渲染时重置所有状态
  const MarkdownPreview = lazy(() => import('./MarkdownPreview.js'));
  // ...
}

// fix
import { lazy } from 'react';

// Good: 将 lazy 组件声明在组件外部
const MarkdownPreview = lazy(() => import('./MarkdownPreview.js'));

function Editor() {
  // ...
}
```

## 4. 一句话总结用法

>`lazy`用于在组件第一次渲染前延迟加载该组件，接收一个返回`Promise`或者`类Promise对象`的函数，会将其解析成组件，通过配合`Suspense`在组件等待加载时，给到可感知的展示效果。