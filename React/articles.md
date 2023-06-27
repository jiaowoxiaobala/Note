1. [Before You memo()](https://overreacted.io/before-you-memo/)

>讲的是在使用`useMemo`和`memo`做优化前，可以**从不变的部分中分割出变化的部分**来代替`memo`。


- 向下移动`state`

```ts
import { useState } from 'react';

// 这是一个具有渲染性能的组件，当color改变时，ExpensiveTree组件也会重新渲染
export default function App() {
  const [color, setColor] = useState('red');
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p style={{ color }}>Hello, world!</p>
      <ExpensiveTree />
    </div>
  );
}

function ExpensiveTree() {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // Artificial delay -- do nothing for 100ms
  }
  return <p>I am a very slow component tree.</p>;
}

// fix
export default function App() {
  return (
    <>
      <Form />
      <ExpensiveTree />
    </>
  );
}

function Form() {
  const [color, setColor] = useState('red');
  return (
    <>
      // 把真正关心color状态的部分提取到Form组件中，然后将状态移到该组件
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p style={{ color }}>Hello, world!</p>
    </>
  );
}
```

- 内容提升

```ts
export default function App() {
  const [color, setColor] = useState('red');
  return (
    // 如果将color绑定到父元素div中，向下移动状态就无法奏效
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p>Hello, world!</p>
      <ExpensiveTree />
    </div>
  );
}

// fix
export default function App() {
  return (
    // 将不关心color的部分依然放到APP组件中，然后以JSX内容的形式传递给ColorPicker
    // 当color变化时，ColorPicker会重新渲染，但它仍然保留着上一次从APP中拿到相同的Children属性
    <ColorPicker>
      <p>Hello, world!</p>
      <ExpensiveTree />
    </ColorPicker>
  );
}

// 依赖color的代码就和color state变量一起放入ColorPicker组件里
function ColorPicker({ children }) {
  const [color, setColor] = useState("red");
  return (
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      {children}
    </div>
  );
}
```


2. [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)

>深入介绍了`useEffect`的各种相关知识。下面是一个取自文中的例子，**当你想更新一个状态，并且这个状态更新依赖于另一个状态的值时，你可能需要用useReducer去替换它们**。

```ts
// 这个Counter组件中，定时器会每次在count上增加一个step值
function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  useEffect(() => {
    console.log('effect')
    const id = setInterval(() => {
      setCount(c => c + step);
    }, 1000);
    return () => {
      console.log('clear')
      clearInterval(id)
    };
  // 当修改了step后，会重启定时器，先执行清理函数，打印clear
  // 然后打印effect，重新开启一个定时器
  // 假如不想在step改变后重启定时器，如何从effect中移除对step的依赖呢？
  }, [step]);

  return (
    <>
      <h1>{count}</h1>
      <input value={step} onChange={e => setStep(Number(e.target.value))} />
    </>
  );
}


// useReducer改进 - 把组件内发生了什么(actions)和状态如何响应并更新分开表述，移除不必要
// 的依赖，避免不必要的effect调用
function Counter() {
  // React会保证dispatch在组件的生命周期内保持不变，所以就不用重新订阅定时器
  const [state, dispatch] = useReducer(reducer, initialState);
  const { count, step } = state;

  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'tick' });
    }, 1000);
    return () => clearInterval(id);
  // 用一个dispatch依赖去代替step的依赖
  }, [dispatch]);

  return (
    <>
      <h1>{count}</h1>
      <input value={step} onChange={e => {
        dispatch({
          type: 'step',
          step: Number(e.target.value)
        });
      }} />
    </>
  );
}

const initialState = {
  count: 0,
  step: 1,
};

// 更新状态的逻辑交由reduer去统一处理
function reducer(state, action) {
  const { count, step } = state;
  if (action.type === 'tick') {
    return { count: count + step, step };
  } else if (action.type === 'step') {
    return { count, step: action.step };
  } else {
    throw new Error();
  }
}
```


3. [How to fetch data with React Hooks](https://www.robinwieruch.de/react-hooks-fetch-data/)

>一步步讲解如何封装一个请求`Hook`。

收集中...