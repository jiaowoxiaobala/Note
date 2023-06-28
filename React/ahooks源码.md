分析`ahooks`源码，学习自定义`Hooks`。

## 和状态相关的`Hooks`

### useSetState

>管理对象状态的Hook。

```ts
import { useCallback, useState } from 'react';

// 通过类型谓词定义一个类型保护，传入的value如果是函数，则这个value的类型是(...args: any) => any
// const isFunction = (value: unknown): value is (...args: any) => any => typeof value === 'function';
import { isFunction } from '../utils';

// 使用这个类型时，只用传递一个泛型参数
export type SetState<S extends Record<string, any>> = <K extends keyof S>(
  // 这里Pick<S, K>就是S
  state: Pick<S, K> | null | ((prevState: Readonly<S>) => Pick<S, K> | S | null),
) => void;

// 上面这个类型定义类似这样，给了K一个默认值
// export type SetState<S extends Record<string, any>, K extends keyof S = keyof S> = (
//   state: Pick<S, K> | null | ((prevState: Readonly<S>) => Pick<S, K> | S | null),
// ) => void


// 管理对象类型的状态（state
const useSetState = <S extends Record<string, any>>(
  // 接收一个对象或者返回对象的函数 - 和useState接收的参数一样，只不过这里是对象
  initialState: S | (() => S),
): [S, SetState<S>] => {
  
  const [state, setState] = useState<S>(initialState);

  const setMergeState = useCallback((patch) => {
    // 设置状态时，如果传入的是函数，就把上一次状态传递给函数执行得到新状态
    setState((prevState) => {
      const newState = isFunction(patch) ? patch(prevState) : patch;

      // 合并新状态，useState对于引用类型，setState要给到一个新的引用
      return newState ? { ...prevState, ...newState } : prevState;
    });
  }, []);

  return [state, setMergeState];
};
```

### useBoolean

>管理布尔值状态的Hook。

```ts
import { useMemo } from 'react';
import useToggle from '../useToggle';

export interface Actions {
  setTrue: () => void;
  setFalse: () => void;
  set: (value: boolean) => void;
  toggle: () => void;
}

// 基于useToggle包装了一层
export default function useBoolean(defaultValue = false): [boolean, Actions] {
  const [state, { toggle, set }] = useToggle(!!defaultValue);

  const actions: Actions = useMemo(() => {
    const setTrue = () => set(true);
    const setFalse = () => set(false);
    return {
      toggle,
      // 对传入的值做一次布尔值转换
      set: (v) => set(!!v),
      setTrue,
      setFalse,
    }
  // 空的依赖数组，保证组件重新渲染actions引用不变
  }, []);

  return [state, actions];
}
```

### useToggle

>在两个状态值之间切换的Hook。

```ts
import { useMemo, useState } from 'react';

export interface Actions<T> {
  setLeft: () => void;
  setRight: () => void;
  set: (value: T) => void;
  toggle: () => void;
}

// 函数重载，根据参数的类型和数量为函数提供不同的类型定义
function useToggle<T = boolean>(): [boolean, Actions<T>];

function useToggle<T>(defaultValue: T): [T, Actions<T>];

// 传递两个参数时，返回值类型是[这两个参数类型组成的联合类型，行为]
function useToggle<T, U>(defaultValue: T, reverseValue: U): [T | U, Actions<T | U>];

function useToggle<D, R>(defaultValue: D = false as unknown as D, reverseValue?: R) {
  const [state, setState] = useState<D | R>(defaultValue);

  const actions = useMemo(() => {
    // 如果没有传递reverseValue，给到defaultValue取反的默认值
    const reverseValueOrigin = (reverseValue === undefined ? !defaultValue : reverseValue) as D | R;

    // 在两个状态值之间切换，根据上一次的状态判断属于那个状态值
    const toggle = () => setState((s) => (s === defaultValue ? reverseValueOrigin : defaultValue));

    // 直接设置状态值
    const set = (value: D | R) => setState(value);
    const setLeft = () => setState(defaultValue);
    const setRight = () => setState(reverseValueOrigin);

    return {
      toggle,
      set,
      setLeft,
      setRight,
    };
    // useToggle ignore value change
    // }, [defaultValue, reverseValue]);
  }, []);

  return [state, actions];
}
```

### useUrlState

### useCookieState

>将状态存储在`Cookie`中的`Hook`。

```ts


```
