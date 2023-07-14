分析`ahooks`源码，学习自定义`Hooks`。


## LifeCycle

### useMount

>只在组件初始化时执行的`Hook`。

```ts
import { useEffect } from 'react';
import { isFunction } from '../utils';
import isDev from '../utils/isDev';

// 模拟componentDidMount生命周期
const useMount = (fn: () => void) => {
  // 校验传参
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(
        `useMount: parameter \`fn\` expected to be a function, but got "${typeof fn}".`,
      );
    }
  }

  // useEffect的依赖项为空数组时，只会在组件挂载时执行一次
  useEffect(() => {
    fn?.();
  }, []);
};
```
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

>通过`url query`来管理`state`的 Hook。

```ts
import { useMemoizedFn, useUpdate } from 'ahooks';
// 依赖query-string
import { parse, stringify } from 'query-string';
import type { ParseOptions, StringifyOptions } from 'query-string';
import { useMemo, useRef } from 'react';
import type * as React from 'react';
import * as tmp from 'react-router';

// ignore waring `"export 'useNavigate' (imported as 'rc') was not found in 'react-router'`
const rc = tmp as any;

export interface Options {
  // 路由切换模式
  navigateMode?: 'push' | 'replace';
  parseOptions?: ParseOptions;
  stringifyOptions?: StringifyOptions;
}

// 配置parse配置
const baseParseConfig: ParseOptions = {
  // 是否解析数字类型
  parseNumbers: false,
  // 是否解析布尔类型
  parseBooleans: false,
};

// 默认stringify配置
const baseStringifyConfig: StringifyOptions = {
  // 跳过以null作为值的键
  skipNull: false,
  // 跳过以空字符串作为值的键。
  skipEmptyString: false,
};

type UrlState = Record<string, any>;

const useUrlState = <S extends UrlState = UrlState>(
  initialState?: S | (() => S),
  options?: Options,
) => {
  type State = Partial<{ [key in keyof S]: any }>;
  const { navigateMode = 'push', parseOptions, stringifyOptions } = options || {};

  // 配置合并
  const mergedParseOptions = { ...baseParseConfig, ...parseOptions };
  const mergedStringifyOptions = { ...baseStringifyConfig, ...stringifyOptions };

  // https://github.com/remix-run/history/blob/main/docs/api-reference.md#location
  const location = rc.useLocation();

  // react-router v5
  const history = rc.useHistory?.();
  // react-router v6
  const navigate = rc.useNavigate?.();

  const update = useUpdate();

  // 保存初始值
  const initialStateRef = useRef(
    typeof initialState === 'function' ? (initialState as () => S)() : initialState || {},
  );

  const queryFromUrl = useMemo(() => {
    // 将查询字符串解析为对象
    return parse(location.search, mergedParseOptions);
  }, [location.search]);

  // url query对象
  const targetQuery: State = useMemo(
    () => ({
      ...initialStateRef.current,
      ...queryFromUrl,
    }),
    [queryFromUrl],
  );

  const setState = (s: React.SetStateAction<State>) => {
    const newQuery = typeof s === 'function' ? s(targetQuery) : s;

    // 1. 如果 setState 后，search 没变化，就需要 update 来触发一次更新。
    // 2. update 和 history 的更新会合并，不会造成多次更新
    update();

    // 兼容react-touer v5和v6
    if (history) {
      history[navigateMode](
        {
          hash: location.hash,
          search: stringify({ ...queryFromUrl, ...newQuery }, mergedStringifyOptions) || '?',
        },
        location.state,
      );
    }
    if (navigate) {
      navigate(
        {
          hash: location.hash,
          // 将对象字符串化为查询字符串
          search: stringify({ ...queryFromUrl, ...newQuery }, mergedStringifyOptions) || '?',
        },
        {
          replace: navigateMode === 'replace',
          state: location.state,
        },
      );
    }
  };

  return [targetQuery, useMemoizedFn(setState)] as const;
};
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

### useUpdateEffect

>`useUpdateEffect`用法等同于`useEffect`，但是会忽略首次执行，只在依赖更新时执行。

```ts
import { useEffect } from 'react';
import { createUpdateEffect } from '../createUpdateEffect';

// 通过createUpdateEffect工厂函数创建
export default createUpdateEffect(useEffect);


// createUpdateEffect.ts
import { useRef } from 'react';
import type { useEffect, useLayoutEffect } from 'react';

type EffectHookType = typeof useEffect | typeof useLayoutEffect;

// 接收useEffect或者useLayoutEffect
export const createUpdateEffect: (hook: EffectHookType) => EffectHookType =
  (hook) => (effect, deps) => {
    const isMounted = useRef(false);

    // for react-refresh
    // 组件卸载后，修改isMounted
    // 比如有这样一个场景：show && <Child/>，show的状态决定是否渲染组件，当show从true转为false时，需要修改isMounted
    hook(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);

    hook(() => {
      if (!isMounted.current) {
        isMounted.current = true;
      } else {
        // 这里返回effect调用的返回值（清除副作用
        return effect();
      }
    }, deps);
  };
```

### useUpdateLayoutEffect

>`useUpdateLayoutEffect`用法等同于 `useLayoutEffect`，但是会忽略首次执行，只在依赖更新时执行。

```ts
import { useLayoutEffect } from 'react';
import { createUpdateEffect } from '../createUpdateEffect';

// 通过createUpdateEffect工厂函数创建
export default createUpdateEffect(useLayoutEffect);
```

### useAsyncEffect

>`useEffect`支持异步函数。

```ts
import type { DependencyList } from 'react';
import { useEffect } from 'react';
import { isFunction } from '../utils';

// 判断是否是异步生成器函数
// function* gen() {
function isAsyncGenerator(
  val: AsyncGenerator<void, void, void> | Promise<void>,
): val is AsyncGenerator<void, void, void> {

  // Symbol.asyncIterator指定了一个对象的默认异步迭代器
  return isFunction(val[Symbol.asyncIterator]);
}

/**
 * 默认的effect不支持传入异步函数
 * useEffect(async () => {}, []） X
 * 
 * 如果需要在useEffect中使用异步函数
 * useEffect(() => {
 *  async function fn() {
 *  }
 * 
 *  await fn();
 * }, [])
 */

function useAsyncEffect(
  effect: () => AsyncGenerator<void, void, void> | Promise<void>,
  deps?: DependencyList,
) {
  // 思路其实是包裹了一层，在useEffect中执行异步函数，而不是传入useEffec的副作用函数就是异步函数
  useEffect(() => {
    const e = effect();
    let cancelled = false;
    async function execute() {
      if (isAsyncGenerator(e)) {
        // 自动迭代
        while (true) {
          const result = await e.next();
          // 迭代完成 || 取消迭代
          if (result.done || cancelled) {
            break;
          }
        }
      } else {
        await e;
      }
    }
    execute();

    // 清除副作用（取消迭代
    return () => {
      cancelled = true;
    };
  }, deps);
}
```

### useDebounceEffect

>为`useEffect`增加防抖的能力。

```ts
import { useEffect, useState } from 'react';
import type { DependencyList, EffectCallback } from 'react';
import type { DebounceOptions } from '../useDebounce/debounceOptions';
import useDebounceFn from '../useDebounceFn';
// 会忽略首次执行，只在依赖更新时执行副作用
import useUpdateEffect from '../useUpdateEffect';

function useDebounceEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: DebounceOptions,
) {
  const [flag, setFlag] = useState({});

  // 给这个flag状态更新加上防抖
  const { run } = useDebounceFn(() => {
    // 这里很巧妙，每次都给到一个新的空对象，这样就能保证每次都是不同的值（引用不同）
    setFlag({});
  }, options);

  // 追踪依赖变化，更新flag状态
  useEffect(() => {
    return run();
  }, deps);

  // flag更新后，执行efffect
  // 通过值的防抖更新，再把这个值给到副作用执行的依赖项，就实现了防抖的副作用执行
  useUpdateEffect(effect, [flag]);
}
```
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

### useThrottleEffect

>为`useEffect`增加节流的能力。

```ts
import { useEffect, useState } from 'react';
import type { DependencyList, EffectCallback } from 'react';
import type { ThrottleOptions } from '../useThrottle/throttleOptions';
import useThrottleFn from '../useThrottleFn';
import useUpdateEffect from '../useUpdateEffect';

function useThrottleEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: ThrottleOptions,
) {
  const [flag, setFlag] = useState({});

  // 给这个flag状态更新加上节流
  const { run } = useThrottleFn(() => {

    // 每次都给到一个新的空对象，这样就能保证每次都是不同的值（引用不同）
    setFlag({});
  }, options);

  // 追踪依赖变化，更新flag状态
  useEffect(() => {
    return run();
  }, deps);

  // flag更新后，执行efffect
  // 通过值的节流更新，再把这个值给到副作用执行的依赖项，就实现了节流的副作用执行
  useUpdateEffect(effect, [flag]);
}
```

### useDeepCompareEffect

>用法与`useEffect`一致，但`deps`通过`lodash isEqual`进行深比较。

```ts
import { useEffect } from 'react';
import { createDeepCompareEffect } from '../createDeepCompareEffect';

// 通过createDeepCompareEffect工厂函数创建
export default createDeepCompareEffect(useEffect);


// createDeepCompareEffect.ts
import { useRef } from 'react';
import type { DependencyList, useEffect, useLayoutEffect } from 'react';

// depsEqual = (aDeps: DependencyList = [], bDeps: DependencyList = []) => isEqual(aDeps, bDeps);
// 依赖lodash的isEqual方法
import { depsEqual } from '../utils/depsEqual';

type EffectHookType = typeof useEffect | typeof useLayoutEffect;
type CreateUpdateEffect = (hook: EffectHookType) => EffectHookType;

export const createDeepCompareEffect: CreateUpdateEffect = (hook) => (effect, deps) => {
  // ref存储传入的依赖项
  const ref = useRef<DependencyList>();
  const signalRef = useRef<number>(0);

  // 每次都（深度）比较依赖项是否相同，不同则更新signalRef
  // 如果依赖项中的值是引用类型，即使引用不同，但是值相同，也不会触发副作用的执行
  if (deps === undefined || !depsEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  // signalRef的更新触发副作用的执行
  hook(effect, [signalRef.current]);
};
```

### useDeepCompareLayoutEffect

>用法与`useLayoutEffect`一致，但`deps`通过`lodash isEqual`进行深比较。

```ts
import { useLayoutEffect } from 'react';
import { createDeepCompareEffect } from '../createDeepCompareEffect';

// 通过createDeepCompareEffect工厂函数创建
export default createDeepCompareEffect(useLayoutEffect);
```

### useInterval

>一个可以处理`setInterval`的`Hook`。

```ts
import { useCallback, useEffect, useRef } from 'react';
import useMemoizedFn from '../useMemoizedFn';

// const isNumber = (value: unknown): value is number => typeof value === 'number';
import { isNumber } from '../utils';

const useInterval = (fn: () => void, delay?: number, options: { immediate?: boolean } = {}) => {
  const timerCallback = useMemoizedFn(fn);
  const timerRef = useRef<NodeJS.Timer | null>(null);

  // 清除计时器
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  useEffect(() => {
    // 边界处理，delay必须是数字，且大于0
    if (!isNumber(delay) || delay < 0) {
      return;
    }

    // 立即执行
    if (options.immediate) {
      timerCallback();
    }
    timerRef.current = setInterval(timerCallback, delay);
    return clear;
  }, [delay, options.immediate]);

  return clear;
};
```

### useRafInterval

>用`requestAnimationFrame`模拟实现`setInterval`，API和`useInterval`保持一致，好处是可以在页面不渲染的时候停止执行定时器，比如页面隐藏或最小化等。(Node环境下`requestAnimationFrame`会自动降级到`setInterval`)

请注意，如下两种情况下很可能是不适用的，优先考虑 `useInterval` ：

- 时间间隔小于 `16ms`
- 希望页面不渲染的情况下依然执行定时器

```ts
import { useCallback, useEffect, useRef } from 'react';
import useLatest from '../useLatest';
import { isNumber } from '../utils';

interface Handle {
  id: number | NodeJS.Timer;
}

const setRafInterval = function (callback: () => void, delay: number = 0): Handle {
  if (typeof requestAnimationFrame === typeof undefined) {
    return {
      id: setInterval(callback, delay),
    };
  }

  // 记录开始时间
  let start = new Date().getTime();
  const handle: Handle = {
    id: 0,
  };
  const loop = () => {
    const current = new Date().getTime();
    // 判断当前时间与开始时间的差值是否大于等于delay，如果是则执行回调
    if (current - start >= delay) {
      callback();

      // 更新开始时间
      start = new Date().getTime();
    }
    // 递归调用loop
    handle.id = requestAnimationFrame(loop);
  };
  handle.id = requestAnimationFrame(loop);
  return handle;
};

// 判断当前环境是否不存在cancelAnimationFrame
function cancelAnimationFrameIsNotDefined(t: any): t is NodeJS.Timer {
  return typeof cancelAnimationFrame === typeof undefined;
}

// 根据环境选择清除对应api
const clearRafInterval = function (handle: Handle) {
  if (cancelAnimationFrameIsNotDefined(handle.id)) {
    return clearInterval(handle.id);
  }
  cancelAnimationFrame(handle.id);
};

function useRafInterval(
  fn: () => void,
  delay: number | undefined,
  options?: {
    immediate?: boolean;
  },
) {
  const immediate = options?.immediate;

  const fnRef = useLatest(fn);
  const timerRef = useRef<Handle>();

  useEffect(() => {
    // 边界处理，delay必须是数字，且大于0
    if (!isNumber(delay) || delay < 0) return;

    // 立即执行
    if (immediate) {
      fnRef.current();
    }
    timerRef.current = setRafInterval(() => {
      fnRef.current();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearRafInterval(timerRef.current);
      }
    };
  }, [delay]);

  // 暴露清除计时器的方法（给到用户
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearRafInterval(timerRef.current);
    }
  }, []);

  return clear;
}
```

### useTimeout

>一个可以处理`setTimeout`计时器函数的`Hook`。

```ts
import { useCallback, useEffect, useRef } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import { isNumber } from '../utils';

const useTimeout = (fn: () => void, delay?: number) => {
  const timerCallback = useMemoizedFn(fn);
  // 存储定时器id
  const timerRef = useRef<NodeJS.Timer | null>(null);

  // 清除函数
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    // 边界处理，delay必须是数字，且大于0
    if (!isNumber(delay) || delay < 0) {
      return;
    }
    timerRef.current = setTimeout(timerCallback, delay);
    return clear;
  }, [delay]);

  return clear;
};
```

### useRafTimeout

>用 `requestAnimationFrame` 模拟实现 `setTimeout`，API 和 `useTimeout` 保持一致，好处是可以在页面不渲染的时候不触发函数执行，比如页面隐藏或最小化等。(Node 环境下 `requestAnimationFrame` 会自动降级到 `setTimeout`)

```ts
import { useCallback, useEffect, useRef } from 'react';
import useLatest from '../useLatest';
import { isNumber } from '../utils';

interface Handle {
  id: number | NodeJS.Timeout;
}

const setRafTimeout = function (callback: () => void, delay: number = 0): Handle {
  // 环境兼容处理
  if (typeof requestAnimationFrame === typeof undefined) {
    return {
      id: setTimeout(callback, delay),
    };
  }

  const handle: Handle = {
    id: 0,
  };

  // 开始时间
  const startTime = new Date().getTime();

  const loop = () => {
    const current = new Date().getTime();
    // 和useRafInterval不同的是这里
    // 判断当前时间与开始时间的差值是否大于等于delay，如果是则执行回调
    if (current - startTime >= delay) {
      callback();
    } else {
      // 否则递归调用loop
      handle.id = requestAnimationFrame(loop);
    }
  };
  handle.id = requestAnimationFrame(loop);
  return handle;
};

function cancelAnimationFrameIsNotDefined(t: any): t is NodeJS.Timer {
  return typeof cancelAnimationFrame === typeof undefined;
}

const clearRafTimeout = function (handle: Handle) {
  if (cancelAnimationFrameIsNotDefined(handle.id)) {
    return clearTimeout(handle.id);
  }
  cancelAnimationFrame(handle.id);
};

function useRafTimeout(fn: () => void, delay: number | undefined) {
  const fnRef = useLatest(fn);
  const timerRef = useRef<Handle>();

  useEffect(() => {
    // 边界处理，delay必须是数字，且大于0
    if (!isNumber(delay) || delay < 0) return;
    timerRef.current = setRafTimeout(() => {
      fnRef.current();
    }, delay);
    return () => {
      if (timerRef.current) {
        clearRafTimeout(timerRef.current);
      }
    };
  }, [delay]);

  // 清除函数
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearRafTimeout(timerRef.current);
    }
  }, []);

  return clear;
}
```

### useLockFn

>用于给一个异步函数增加竞态锁，防止并发执行。

```ts
import { useRef, useCallback } from 'react';

function useLockFn<P extends any[] = any[], V extends any = any>(fn: (...args: P) => Promise<V>) {
  // 防重复触发标识
  const lockRef = useRef(false);

  return useCallback(
    async (...args: P) => {
      // 拦截重复触发
      if (lockRef.current) return;
      lockRef.current = true;
      try {
        const ret = await fn(...args);

        // 异步函数执行完毕后，lockRef.current 置为 false，表示fn可以进行下一次执行
        lockRef.current = false;
        return ret;
      } catch (e) {
        // 执行报错后，更新标识
        lockRef.current = false;
        throw e;
      }

      // finally {
      //   lockRef.current = false;
      // }
    },
    [fn],
  );
}
```

### useUpdate

>`useUpdate`会返回一个函数，调用该函数会强制组件重新渲染。

```ts
import { useCallback, useState } from 'react';

const useUpdate = () => {
  // 通过useState返回的setState方法
  const [, setState] = useState({});

  // 每次更新为一个新的空对象（引用地址不同），从而触发组件更新
  return useCallback(() => setState({}), []);
};
```

## DOM

### useEventListener

>优雅地使用`addEventListener`。

```ts
import useLatest from '../useLatest';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import useEffectWithTarget from '../utils/useEffectWithTarget';

type noop = (...p: any) => void;

export type Target = BasicTarget<HTMLElement | Element | Window | Document>;

type Options<T extends Target = Target> = {
  target?: T;
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
};

// 函数重载，根据参数的类型和数量为函数提供不同的类型定义
function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  options?: Options<HTMLElement>,
): void;
function useEventListener<K extends keyof ElementEventMap>(
  eventName: K,
  handler: (ev: ElementEventMap[K]) => void,
  options?: Options<Element>,
): void;
function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (ev: DocumentEventMap[K]) => void,
  options?: Options<Document>,
): void;
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (ev: WindowEventMap[K]) => void,
  options?: Options<Window>,
): void;
function useEventListener(eventName: string, handler: noop, options: Options): void;

function useEventListener(eventName: string, handler: noop, options: Options = {}) {
  const handlerRef = useLatest(handler);

  // useEffectWithTarget = createEffectWithTarget(useEffect);
  useEffectWithTarget(
    () => {
      // 获取目标元素
      const targetElement = getTargetElement(options.target, window);
      // 边界处理，目标元素不存在或者不支持addEventListener方法
      if (!targetElement?.addEventListener) {
        return;
      }

      // 事件处理函数
      const eventListener = (event: Event) => {
        return handlerRef.current(event);
      };

      // 添加事件监听
      targetElement.addEventListener(eventName, eventListener, {
        // 一个布尔值，表示 eventListener 会在该类型的事件捕获阶段传播到该 EventTarget 时触发。
        capture: options.capture,

        // 表示 eventListener 在添加之后最多只调用一次。如果为 true，eventListener 会在其被调用之后自动移除
        once: options.once,
        // 一个布尔值，设置为 true 时，表示 eventListener 永远不会调用 preventDefault()
        passive: options.passive,
      });

      // 清除副作用（移除事件监听
      return () => {
        targetElement.removeEventListener(eventName, eventListener, {
          capture: options.capture,
        });
      };
    },

    // 依赖项数组和目标元素改变都会重新执行传入的回调函数
    [eventName, options.capture, options.once, options.passive],
    options.target,
  );
}


// createEffectWithTarget.ts
import type { DependencyList, EffectCallback, useEffect, useLayoutEffect } from 'react';
import { useRef } from 'react';
import useUnmount from '../useUnmount';
import depsAreSame from './depsAreSame';
import type { BasicTarget } from './domTarget';
import { getTargetElement } from './domTarget';

const createEffectWithTarget = (useEffectType: typeof useEffect | typeof useLayoutEffect) => {
  /**
   *
   * @param effect
   * @param deps
   * @param target target should compare ref.current vs ref.current, dom vs dom, ()=>dom vs ()=>dom
   */
  const useEffectWithTarget = (
    effect: EffectCallback,
    deps: DependencyList,
    target: BasicTarget<any> | BasicTarget<any>[],
  ) => {
    // 是否初始化了
    const hasInitRef = useRef(false);

    const lastElementRef = useRef<(Element | null)[]>([]);
    const lastDepsRef = useRef<DependencyList>([]);

    // 保存清除副作用回调
    const unLoadRef = useRef<any>();

    // 没传入依赖项数组，所以组件每次更新都会执行（手动控制
    useEffectType(() => {
      const targets = Array.isArray(target) ? target : [target];
      const els = targets.map((item) => getTargetElement(item));

      // 初始执行一次
      if (!hasInitRef.current) {
        hasInitRef.current = true;

        // 目标元素数组
        lastElementRef.current = els;

        // 依赖项
        lastDepsRef.current = deps;

        // 执行副作用函数
        unLoadRef.current = effect();
        return;
      }

      // 依赖项或者有目标元素发生变化，重新执行
      if (
        els.length !== lastElementRef.current.length ||

        // depsAreSame：遍历每一项通过Object.is比较是否相等
        !depsAreSame(els, lastElementRef.current) ||
        !depsAreSame(deps, lastDepsRef.current)
      ) {
        unLoadRef.current?.();

        lastElementRef.current = els;
        lastDepsRef.current = deps;
        unLoadRef.current = effect();
      }
    });

    useUnmount(() => {
      unLoadRef.current?.();
      // for react-refresh
      // 组件重新渲染时，把hasInitRef.current 重置为 false
      hasInitRef.current = false;
    });
  };

  return useEffectWithTarget;
};
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