## [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)

>当需要组件记住某些信息（数据），但又不想这些信息触发重渲染时，可以使用`ref`。

### Adding a ref to your component 

>`ref`可以保存任何类型的值，与`state`不同的是，`ref`是一个普通的`JavaScript`对象，具有可以被读取和修改的`current`属性，更新`ref`不会导致组件重新渲染。

```ts
export default function Counter() {
  // 调用useRef，并传入初始值，{ current：0 }
  let ref = useRef(0); 

  function handleClick() {
    // 组件不会在每次ref发生变化时重新渲染
    ref.current = ref.current + 1;
    alert('你点击了 ' + ref.current + ' 次！');
  }

  return (
    <button onClick={handleClick}>
      点击我！
    </button>
  );
}
```

### Differences between refs and state 

| ref | state |
|--- | --- |
| `useRef(initialValue)`返回 `{ current: initialValue }`  |   `useState(initialValue)` 返回`state`变量的当前值和一个`state`设置函数 (` [value, setValue]`)  |
| 更新不会触发组件重新渲染 | 更新时触发组件重新渲染 |
| 可变，可以在渲染过程之外修改和更新`current`的值 | 不可变，需要使用`setState`来更新`state` |
| 不应该在渲染期间读取（或写入）`current`的值 | 可以随时读取`state`，但是每次渲染都有自己不变的状态快照  |

```ts
import { useRef } from 'react';

// ref实现的计数器
export default function Counter() {
  let countRef = useRef(0);

  function handleClick() {
    // 不会触发组件重新渲染
    countRef.current = countRef.current + 1;
  }

  return (
    <button onClick={handleClick}>
      // 这里视图渲染一直未变 
      你点击了 {countRef.current} 次
    </button>
  );
}


// state实现的计数器
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  // 更新状态，触发组件重新渲染
  function handleClick() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      // 视图更新
      你点击了 {count} 次
    </button>
  );
}
```

### When to use refs 

>如果组件需要存储一些值，但不影响渲染逻辑，请选择`ref`。


- 存储`timeout IDS`。

- 存储和操作`DOM`元素。

- 存储不需要被用来计算`JSX`的其他对象。

### Best practices for refs 

- 将`ref`视为应急方案，不要将组件的大部分数据流和应用程序逻辑依赖于`ref`，当使用外部系统或者`浏览器API`(例如`setTimeout`)时，`ref`很有用。

- 不要在渲染过程中读取或写入`ref.current`。如果渲染过程中需要某些信息，用`state`代替。`React`不知道ref.current何时发生变化，即使在渲染期间读取它也会使组件的行为难以预测（除非保证只在第一次渲染期间设置一次`ref`）。

### Refs and the DOM 

>可以将`ref`指向任何值，常见的用法是访问`DOM`元素。将`ref`传递给`JSX`中的`ref`属性时，比如`<div ref={myRef}>`，`React`会将对象的`DOM`元素放入`myRef.current`中。

### Recap

- `ref`是一个应急方案，用于保留不用于渲染的值。

- `ref`是一个普通的`JavaScript`对象，具有一个名为`current`的属性，可以对其进行读取或设置。

- 可以通过调用`useRef Hook`来获取一个`ref`。

- 与`state`一样，`ref`允许在组件的重新渲染之间保留信息。

- 与`state`不同，设置`ref`的`current`值不会触发重新渲染。

- 不要在渲染过程中读取或写入`ref.current`。这使你的组件难以预测。

## [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)

>`React`会自动处理更新`DOM`以匹配渲染输出，因此通常不需要在组件中操作`DOM`。有时需要访问由`React`管理的`DOM`元素，可以通过一个指向`DOM`节点的`ref`来实现。

### Getting a ref to the node 

>`useRef Hook`返回一个对象，该对象有一个名为`current`的属性，最初`ref.current`是`null`。当`React`创建`DOM`节点时，会把该节点的引用放入`current`属性。


### Example: Focusing a text input 

```ts
import { useRef } from 'react';

export default function Form() {
  // 使用 useRef Hook 声明 inputRef
  const inputRef = useRef(null);

  function handleClick() {
    // 访问input调用它的focus方法
    inputRef.current.focus();
  }

  return (
    <>
      // React会将这个input节点放入inputRef.current
      <input ref={inputRef} />
      <button onClick={handleClick}>
        Focus the input
      </button>
    </>
  );
}
```

### How to manage a list of refs using a ref callback 

```tsx
import { useRef } from 'react';

export default function CatFriends() {
  // ref可以保存任意类型的值
  const itemsRef = useRef(null);

  function scrollToId(itemId) {
    const map = getMap();
    const node = map.get(itemId);
    node.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  function getMap() {
    if (!itemsRef.current) {
      // 首次运行时初始化 Map。
      itemsRef.current = new Map();
    }
    return itemsRef.current;
  }

  return (
    <>
      <nav>
        <button onClick={() => scrollToId(0)}>
          Tom
        </button>
        <button onClick={() => scrollToId(5)}>
          Maru
        </button>
        <button onClick={() => scrollToId(9)}>
          Jellylorum
        </button>
      </nav>
      <div>
        <ul>
          {catList.map(cat => (
            <li
              key={cat.id}
              ref={(node) => {
                // 将函数传递给 ref 属性
                // 这个函数会接收一个参数指向这个DOM节点
                const map = getMap();
                if (node) {
                  map.set(cat.id, node);
                } else {
                  map.delete(cat.id);
                }
              }}
            >
              <img
                src={cat.imageUrl}
                alt={'Cat #' + cat.id}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const catList = [];
for (let i = 0; i < 10; i++) {
  catList.push({
    id: i,
    imageUrl: 'https://placekitten.com/250/200?image=' + i
  });
}
```

### Accessing another component’s DOM nodes 

>当把`ref`放在函数式组件上会得到`null`，这是因为默认情况下，`React`不允许组件访问其他组件的`DOM`节点。

```ts
import { forwardRef, useRef } from 'react';

// 通过forwardRef转发父组件传入的ref
const MyInput = forwardRef((props, ref) => {

  // 再把接收到的ref传递给内部的input DOM节点
  return <input {...props} ref={ref} />;
});

export default function Form() {
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current.focus();
  }

  return (
    <>
      // 将ref传入MyInput
      <MyInput ref={inputRef} />
      <button onClick={handleClick}>
        聚焦输入框
      </button>
    </>
  );
}
```

### When React attaches the refs 

在`React`中，每次更新都分为两个阶段：

- `render`阶段，`React`调用组件来确定视图渲染。

- `commit`阶段，`React`把变更应用于`DOM`。


### Best practices for DOM manipulation with refs 

>避免更改由`React`管理的`DOM`节点。

```ts
import { useState, useRef } from 'react';

export default function Counter() {
  const [show, setShow] = useState(true);
  const ref = useRef(null);

  return (
    <div>
      <button
        // setShow更新状态触发重新渲染后，p节点已经从组件树中删除
        // 因此点击第二个按钮时会报错
        onClick={() => {
          setShow(!show);
        }}>
        通过 setState 切换
      </button>
      <button
        onClick={() => {
          ref.current.remove();
        }}>
        从 DOM 中删除
      </button>
      {show && <p ref={ref}>Hello world</p>}
    </div>
  );
}
```

## [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)