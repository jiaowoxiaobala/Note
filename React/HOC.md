### 什么是高阶组件 higher-order component

>`React`中复用组件逻辑的一种技巧。是一个接收组件参数，返回组件的函数。

```ts
// 接收一个组件参数
const HOC = Component => {
  // 逻辑处理...

  // 返回一个组件
  return props => <Component {...props} />;
};
```

### 高阶组件有什么用

#### 属性代理

>对原组件的`props`进行增加、修改、删除或其他特殊操作。

```ts
function withStyles(Component) {
  return props => {
    const style = {
      padding: '0.2rem',
      margin: '1rem',
      ...props.style
    }
 
    return <Component style={style} {...props} />
  }
}
 
const Button = () = <button style={{ color: 'red' }}>Click me!</button>
const StyledButton = withStyles(Button)
```

#### 渲染劫持

>将任何其他组件和原组件进行组合渲染，也可以根据特定属性决定原组件渲染结果。

```ts
const withLoadingFeedback = component => props => {
  // 条件渲染
  if (props.isLoading) return <div>Loading...</div>
  return <Component {...props} />
}

const withNoDataFeedback = component => props => {
  if (!props.data) return <div>No Data</div>
  return <Component {...props} />
}

// 组合其他组件
withLoadingFeedback(
  withNoDataFeedback(
    WrappedComponent
  )
);


// 封装一个组合函数
const compose = (...fns) =>
  fns.reduceRight((prevFn, nextFn) =>
    (...args) => nextFn(prevFn(...args)),
    value => value
  );

compose(withNoDataFeedback, withLoadingFeedback)(WrappedComponent)
```


#### 组件赋能

>给原组件额外增加一些功能，

```ts
import { useEffect } from 'react'

const HOC = Component => {
  return props => {
    useEffect(() => {
      // 埋点上报
    }, [])

    const onClick = () => {
      // 事件监听
      props.onClick()
    }
    <Component {...props} onClick={onClick}/>
  };
};
```

待扩展...