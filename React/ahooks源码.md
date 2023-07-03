分析`ahooks`源码，学习自定义`Hooks`。


## LifeCycle
### useUnmount

>在组件卸载`（unmount）`时执行的`Hook`。

```ts
import { useEffect } from 'react';
import useLatest from '../useLatest';
import { isFunction } from '../utils';
import isDev from '../utils/isDev';

const useUnmount = (fn: () => void) => {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(`useUnmount expected parameter is a function, got ${typeof fn}`);
    }
  }

  // 把fn保存到ref中（假设后续的渲染期间传入的fn变了，这里还是保持首次传入的引用
  const fnRef = useLatest(fn);

  useEffect(
    // 传入useEffect的函数，可以返回另一个函数（清理副作用）在组件卸载时执行
    // 这里用了箭头函数的简写
    () => () => {
      fnRef.current();
    },
    [],
  );
};
```

### useUnmountedRef

>获取当前组件是否已经卸载的`Hook`。

```ts
import { useEffect, useRef } from 'react';

const useUnmountedRef = () => {
  const unmountedRef = useRef(false);
  // useEffect(() => () => unmountedRef.current = true, [])
  useEffect(() => {
    unmountedRef.current = false;

    // 组件卸载时把状态改为true
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  return unmountedRef;
};
```


## State

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
import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';
// 组件更新时执行副作用（忽略首次执行
import useUpdateEffect from '../useUpdateEffect';
// isUndef：判断是否是undefined
import { isFunction, isUndef } from '../utils';

export interface IFuncUpdater<T> {
  (previousState?: T): T;
}
export interface IFuncStorage {
  (): Storage;
}

export interface Options<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  defaultValue?: T | IFuncUpdater<T>;
  // 支持自定义错误处理函数
  onError?: (error: unknown) => void;
}

// 创建useStorageState的工厂函数
export function createUseStorageState(getStorage: () => Storage | undefined) {

  function useStorageState<T>(key: string, options: Options<T> = {}) {
    let storage: Storage | undefined;
    const {
      // 默认调用console.error
      onError = (e) => {
        console.error(e);
      },
    } = options;

    // https://github.com/alibaba/hooks/issues/800
    try {
      storage = getStorage();
    } catch (err) {
      onError(err);
    }

    const serializer = (value: T) => {
      // 在stringify前支持自定义处理
      if (options?.serializer) {
        return options?.serializer(value);
      }
      return JSON.stringify(value);
    };

    const deserializer = (value: string): T => {
      // 在parse前支持自定义处理
      if (options?.deserializer) {
        return options?.deserializer(value);
      }
      return JSON.parse(value);
    };

    function getStoredValue() {
      try {
        // 读取key对应存储的value，这里storage可能为undefined，也可能读取的是null
        // window.storage.getItem读取不存在的key时会返回null
        const raw = storage?.getItem(key);
        if (raw) {
          return deserializer(raw);
        }
      } catch (e) {
        onError(e);
      }

      // 兼容处理，没读取到就返回默认值
      if (isFunction(options?.defaultValue)) {
        return options?.defaultValue();
      }
      return options?.defaultValue;
    }

    // 处理状态
    const [state, setState] = useState(() => getStoredValue());

    // 追踪key的变化重新获取key对应的value
    useUpdateEffect(() => {
      setState(getStoredValue());
    }, [key]);

    const updateState = (value?: T | IFuncUpdater<T>) => {
      // 更新状态
      const currentState = isFunction(value) ? value(state) : value;
      setState(currentState);

      // 如果更新后的状态值为undefined，则删除这个key
      if (isUndef(currentState)) {
        storage?.removeItem(key);
      } else {
        try {
          storage?.setItem(key, serializer(currentState));
        } catch (e) {
          console.error(e);
        }
      }
    };

    return [state, useMemoizedFn(updateState)] as const;
  }
  return useStorageState;
}
```

### useSessionStorageState

>将状态存储在`SessionStorage`中的`Hook`。

```ts
import { createUseStorageState } from '../createUseStorageState';
import isBrowser from '../utils/isBrowser';

// createUseStorageState工厂函数分析在上面↑
const useSessionStorageState = createUseStorageState(() =>
  isBrowser ? sessionStorage : undefined,
);
```
### useDebounce

>用来处理防抖值的`Hook`。

```ts
import { useEffect, useState } from 'react';
import useDebounceFn from '../useDebounceFn';
import type { DebounceOptions } from './debounceOptions';

function useDebounce<T>(value: T, options?: DebounceOptions) {
  // 接收传入的value为debounced的初始值
  const [debounced, setDebounced] = useState(value);

  // run会执行传入useDebounceFn的函数（带防抖
  const { run } = useDebounceFn(() => {
    setDebounced(value);
  }, options);

  // 追踪value的变化，更新debounced
  useEffect(() => {
    run();
  }, [value]);

  return debounced;
}
```

### useThrottle

>用来处理节流值的`Hook`。

```ts
import { useEffect, useState } from 'react';
import useThrottleFn from '../useThrottleFn';
// import type { ThrottleOptions } from './throttleOptions';
interface ThrottleOptions {
  // 等待时间，单位为毫秒
  wait?: number;
  // 指定在延迟开始前调用
  leading?: boolean;
  // 指定在延迟结束后调用
  trailing?: boolean;
}


function useThrottle<T>(value: T, options?: ThrottleOptions) {
  // 接收传入的value为throttled的初始值
  const [throttled, setThrottled] = useState(value);

  // run会执行传入useThrottleFn的函数（带节流
  const { run } = useThrottleFn(() => {
    setThrottled(value);
  }, options);

  // 追踪value的变化，更新throttled
  useEffect(() => {
    run();
  }, [value]);

  return throttled;
}
```

### useMap

>管理`Map`类型状态的`Hook`。

```ts
import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';

// IIterable<readonly [K, T]> -> [[K, T]]
function useMap<K, T>(initialValue?: Iterable<readonly [K, T]>) {
  const getInitValue = () => new Map(initialValue);
  const [map, setMap] = useState<Map<K, T>>(getInitValue);

  // 设置map
  const set = (key: K, entry: T) => {
    setMap((prev) => {
      // 基于旧状态构造一个新Map对象（类似拷贝一份一模一样的，但是引用不同
      // const map = new Map([['name', 'bw']]) // Map(1) {'name' => 'bw'}
      // const ma2 = new Map(map) // Map(1) {'name' => 'bw'}
      const temp = new Map(prev);
      temp.set(key, entry);
      return temp;
    });
  };

  const setAll = (newMap: Iterable<readonly [K, T]>) => {
    setMap(new Map(newMap));
  };

  // 移除map中指定元素
  const remove = (key: K) => {
    setMap((prev) => {
      const temp = new Map(prev);
      temp.delete(key);

      return temp;
    });
  };

  // 通过传入的initialValue重置状态
  const reset = () => setMap(getInitValue());

  const get = (key: K) => map.get(key);

  return [
    map,
    {
      set: useMemoizedFn(set),
      setAll: useMemoizedFn(setAll),
      remove: useMemoizedFn(remove),
      reset: useMemoizedFn(reset),
      get: useMemoizedFn(get),
    },
  ] as const;
}
```


### useSet

>管理`Set`类型状态的`Hook`。

```ts
import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';

function useSet<K>(initialValue?: Iterable<K>) {
  const getInitValue = () => new Set(initialValue);
  const [set, setSet] = useState<Set<K>>(getInitValue);

  // 添加、删除都是重新构造一个Set对象，在这个Set对象上操作后更新状态
  const add = (key: K) => {
    if (set.has(key)) {
      return;
    }
    setSet((prevSet) => {
      const temp = new Set(prevSet);
      temp.add(key);
      return temp;
    });
  };

  const remove = (key: K) => {
    if (!set.has(key)) {
      return;
    }
    setSet((prevSet) => {
      const temp = new Set(prevSet);
      temp.delete(key);
      return temp;
    });
  };

  // 通过传入的initialValue重置状态
  const reset = () => setSet(getInitValue());

  return [
    set,
    {
      add: useMemoizedFn(add),
      remove: useMemoizedFn(remove),
      reset: useMemoizedFn(reset),
    },
  ] as const;
}
```

### usePrevious

>保存上一次状态的`Hook`。

```ts
import { useRef } from 'react';

export type ShouldUpdateFunc<T> = (prev: T | undefined, next: T) => boolean;

// 比较两个值是否相等
// Object.is和===(全等)运算符的区别：Object.is将+0，-0判断为不相等，NaN和NaN判断相等（全等运算符相反
const defaultShouldUpdate = <T>(a?: T, b?: T) => !Object.is(a, b);

function usePrevious<T>(
  state: T,
  // 支持自定义 比较（是否更新ref保存的状态）函数
  shouldUpdate: ShouldUpdateFunc<T> = defaultShouldUpdate,
): T | undefined {

  // 通过ref保存状态
  const prevRef = useRef<T>();
  const curRef = useRef<T>();

  if (shouldUpdate(curRef.current, state)) {
    prevRef.current = curRef.current;

    // curRef.current记录状态变更，prevRef保存curRef.current变更前的状态
    curRef.current = state;
  }

  return prevRef.current;
}
```

### useRafState

>在`requestAnimationFrame`回调中更新状态的`Hook`。

```ts
import { useCallback, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import useUnmount from '../useUnmount';

function useRafState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
function useRafState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];

function useRafState<S>(initialState?: S | (() => S)) {
  // 保存requestAnimationFrame的请求ID（用于取消
  const ref = useRef(0);
  const [state, setState] = useState(initialState);

  const setRafState = useCallback((value: S | ((prevState: S) => S)) => {

    // 多次调用取消上一次的（防抖
    cancelAnimationFrame(ref.current);

    // 在浏览器下次重绘之前更新状态
    ref.current = requestAnimationFrame(() => {
      setState(value);
    });
  }, []);

  // 组件卸载时取消
  useUnmount(() => {
    cancelAnimationFrame(ref.current);
  });

  return [state, setRafState] as const;
}
```

### useSafeState

>用法与`React.useState`完全一样，但是在组件卸载后异步回调内的 `setState` 不再执行，避免因组件卸载后更新状态而导致的内存泄漏。

```ts
import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import useUnmountedRef from '../useUnmountedRef';

function useSafeState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];

function useSafeState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];

function useSafeState<S>(initialState?: S | (() => S)) {
  const unmountedRef = useUnmountedRef();
  const [state, setState] = useState(initialState);
  const setCurrentState = useCallback((currentState) => {
    /** if component is unmounted, stop update */
    // 更新状态前判断组件是否卸载
    if (unmountedRef.current) return;
    setState(currentState);
  }, []);

  return [state, setCurrentState] as const;
}
```

### useGetState

>给`React.useState`增加了一个`getter`方法，以获取当前最新值。

```ts
import type { Dispatch, SetStateAction } from 'react';
import { useState, useRef, useCallback } from 'react';

type GetStateAction<S> = () => S;

function useGetState<S>(
  initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>, GetStateAction<S>];
function useGetState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>,
  GetStateAction<S | undefined>,
];
function useGetState<S>(initialState?: S) {
  const [state, setState] = useState(initialState);
  // 通过ref保存最新的状态
  const stateRef = useRef(state);
  stateRef.current = state;

  const getState = useCallback(() => stateRef.current, []);

  return [state, setState, getState];
}
```

### useResetState

>提供重置`state`方法的`Hooks`，用法与 `React.useState` 基本一致。

```ts
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import useMemoizedFn from '../useMemoizedFn';

type ResetState = () => void;

const useResetState = <S>(
  initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>, ResetState] => {
  const [state, setState] = useState(initialState);

  const resetState = useMemoizedFn(() => {
    // 更新状态为传入的初始值
    setState(initialState);
  });

  return [state, setState, resetState];
};
```

## Effect
### useDebounceFn

>用来处理防抖函数的`Hook`。

```ts
// 依赖lodash的debounce工具方法
import debounce from 'lodash/debounce';
import { useMemo } from 'react';
// import type { DebounceOptions } from '../useDebounce/debounceOptions';

import useLatest from '../useLatest';
import useUnmount from '../useUnmount';
import { isFunction } from '../utils';

// process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
import isDev from '../utils/isDev';

// DebounceOptions类型定义
interface DebounceOptions {
  // 需要延迟的毫秒数
  wait?: number;
  // 指定在延迟开始前调用
  leading?: boolean;
  // 指定在延迟结束后调用
  trailing?: boolean;
  // 设置 允许被延迟的最大值
  maxWait?: number;
}

// 任意函数类型
type noop = (...args: any[]) => any;

function useDebounceFn<T extends noop>(fn: T, options?: DebounceOptions) {
  // 开发环境，对传入非函数抛出错误
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(`useDebounceFn expected parameter is a function, got ${typeof fn}`);
    }
  }

  // 把fn存储到ref中
  const fnRef = useLatest(fn);

  const wait = options?.wait ?? 1000;

  // 把debounce缓存起来，在组件更新时引用不变
  const debounced = useMemo(
    () =>
      debounce(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [],
  );

  // 组件卸载时，取消debounced
  useUnmount(() => {
    debounced.cancel();
  });

  return {
    run: debounced,
    cancel: debounced.cancel,

    // 立即调用debounced
    flush: debounced.flush,
  };
}
```

### useThrottleFn

>用来处理函数节流的`Hook`。

```ts
// 依赖lodash的throttle工具方法
import throttle from 'lodash/throttle';
import { useMemo } from 'react';
import useLatest from '../useLatest';
import type { ThrottleOptions } from '../useThrottle/throttleOptions';
import useUnmount from '../useUnmount';
import { isFunction } from '../utils';

// 判断开发环境
import isDev from '../utils/isDev';

// 任意函数类型
type noop = (...args: any[]) => any;

function useThrottleFn<T extends noop>(fn: T, options?: ThrottleOptions) {
  // 开发环境，校验是否传入的是函数，否则报错
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(`useThrottleFn expected parameter is a function, got ${typeof fn}`);
    }
  }

  // 把fn存储到ref中
  const fnRef = useLatest(fn);

  const wait = options?.wait ?? 1000;

  // 把throttle缓存起来，在组件更新时引用不变
  const throttled = useMemo(
    () =>
      throttle(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [],
  );
  
  // 组件卸载时，取消throttled
  useUnmount(() => {
    throttled.cancel();
  });

  return {
    run: throttled,
    cancel: throttled.cancel,
    flush: throttled.flush,
  };
}
```


## Advanced

### useLatest

>返回当前最新值的`Hook`，可以避免闭包问题。

```ts
import { useRef } from 'react';

function useLatest<T>(value: T) {
  // 通过ref保存这个值
  const ref = useRef(value);

  // 组件重渲染时，给到ref最新的值
  ref.current = value;

  return ref;
}
```