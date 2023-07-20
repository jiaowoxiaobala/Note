
[beautiful react hooks官网](https://antonioru.github.io/beautiful-react-hooks/#/Introduction)

### useDefaultedState

>类似`useState`，但是可以传入默认值，并且当`state`为`null`或`undefined`时，返回默认值。

```ts
import { useCallback, useState } from 'react'

// 判断状态是否为null或undefined，如果是则返回默认值
const maybeState = <TValue>(state: TValue, defaultValue?: TValue) => (state ?? defaultValue) as TValue

/**
 * Returns a safe state by making sure the given value is not null or undefined
 */
const useDefaultedState = <TValue>(defaultValue: TValue, initialState?: TValue) => {
  const [state, setState] = useState<TValue>(maybeState(initialState, defaultValue) as TValue)

  const setStateSafe = useCallback((nextState: TValue) => {
    // 更新状态时，也做一次判断
    setState(maybeState(nextState, defaultValue))
  }, [setState])

  return [maybeState(state, defaultValue), setStateSafe] as [TValue, typeof setStateSafe]
}
```

### useMutableState

>提供触发组件重新渲染的可变状态。

[MDN: Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

```ts
import { useMemo, useState } from 'react'

/**
 * Returns a reactive value that can be used as a state.
 * 通过Proxy代理状态，可以直接修改状态，不需要setState
 */
const useMutableState = <TValue, TProxied extends Record<string | symbol, TValue>>(initialState: TProxied) => {
  // type Error参数类型判断
  if (typeof initialState !== 'object' || initialState === null) throw new Error('The initial state must be an object')

  // 通过useState维护一个state，用于触发组件更新
  const [, setState] = useState(0)

  // 创建这个状态的代理
  return useMemo<TProxied>(() => new Proxy(initialState, {
    // 属性设置操作的捕捉器
    set: (target, prop: keyof TProxied, value: TProxied[keyof TProxied]) => {

      // 判断新旧状态是否相同
      if (target && target[prop] !== value) {
        target[prop] = value

        // 触发组件更新
        setState((state) => (state + 1))
      }
      return true
    }
  }), [])
}
```

### useValueHistory

>接受一个变量(可以是`prop`或`state`)，并返回其先前值的数组。用于跟踪跨多个渲染的变量更改，并允许将当前值与其以前的值进行比较。

```ts
import { useEffect, useRef } from 'react'

// 去重：如果这个值在数组中的索引不等于当前索引，说明这个值是重复的
const distinctValues = <T>(value: T, current: number, array: T[]): boolean => array.indexOf(value) === current

/**
 * Accepts a variable (possibly a prop or a state) and returns its history (changes through updates).
 * 记录一个值的历史状态
 */
const useValueHistory = <TValue = unknown>(value: TValue, distinct = false) => {
  // 用ref维护一个状态数组
  const history = useRef<TValue[]>([])

  // quite simple
  // 追踪状态变化
  useEffect(() => {
    // 每次状态变更，都添加到数组中
    history.current.push(value)

    // 如果要去重，过滤掉重复的值
    if (distinct) {
      history.current = history.current.filter(distinctValues)
    }
  }, [value])

  return history.current
}
```