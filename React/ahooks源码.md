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

```ts
todo
```

### useCookieState

>将状态存储在`Cookie`中的`Hook`。

```ts
// 依赖js-cookie
import Cookies from 'js-cookie';
import { useState } from 'react';
// 持久化的缓存一个函数
import useMemoizedFn from '../useMemoizedFn';
import { isFunction, isString } from '../utils';

export type State = string | undefined;

// CookieAttributes的类型定义
interface CookieAttributes {
  /**
   * 指定cookie的有效期，如果省略默认为会话Cookie（max-age也可以设置Cookie的过期
   */
  expires?: number | Date | undefined;
  /**
   * path 和 domain定义Cookie的作用域，即 Cookie 应该发送给哪些 URL
   * 指定一个URL路径，该URL路径必须存在于请求的URL中，以便发送Cookie标头（子路径也会被匹配
   */
  path?: string | undefined;

  /**
   * 指定了哪些主机可以接受 Cookie，默认为创建Cookie时的
   */
  domain?: string | undefined;

  /**
   * 只在安全的协议（HTTPS）下传输，默认值是false
   */
  secure?: boolean | undefined;

  /**
   * 允许服务器指定是否/何时通过跨站点请求发送，提供了一些针对跨站点请求伪造攻击（CSRF）的保护
   */
  sameSite?: 'strict' | 'Strict' | 'lax' | 'Lax' | 'none' | 'None' | undefined;

  // 还有HttpOnly：防止客户端（document.cookie）访问 Cookie，仅作用于服务端

  [property: string]: any;
}

// 继承自Cookies.CookieAttributes并额外增加了一个可选的defaultValue
// 属性都是可选的，因此设置时传入新的options时可以只传入某个属性
export interface Options extends Cookies.CookieAttributes {
  defaultValue?: State | (() => State);
}

function useCookieState(cookieKey: string, options: Options = {}) {
  // 设置state的初始值
  const [state, setState] = useState<State>(() => {

    // 通过cookieKey读取cookie
    const cookieValue = Cookies.get(cookieKey);

    // 如果有值就直接返回
    if (isString(cookieValue)) return cookieValue;

    // 没读取到值返回传入的默认值
    if (isFunction(options.defaultValue)) {
      return options.defaultValue();
    }

    return options.defaultValue;
  });

  const updateState = useMemoizedFn(
    (
      newValue: State | ((prevState: State) => State),
      // 更新状态时，支持传入新的配置options
      newOptions: Cookies.CookieAttributes = {},
    ) => {
      // { ...options, ...newOptions }合并首次传入的配置
      const { defaultValue, ...restOptions } = { ...options, ...newOptions };

      // 获取新状态的值并设置
      const value = isFunction(newValue) ? newValue(state) : newValue;
      setState(value);

      // 如果新状态为undefined，则删除这个cookie
      if (value === undefined) {
        Cookies.remove(cookieKey);
      } else {

        // 更新cookie
        Cookies.set(cookieKey, value, restOptions);
      }
    },
  );

  return [state, updateState] as const;
}
```

### useLocalStorageState

>将状态存储在`localStorage`中的`Hook`。

```ts
import { createUseStorageState } from '../createUseStorageState';

// 是否是浏览器环境 typeof window !== 'undefined' && window.document && window.document.createElement
import isBrowser from '../utils/isBrowser';

const useLocalStorageState = createUseStorageState(() => (isBrowser ? localStorage : undefined));


// createUseStorageState.ts

```