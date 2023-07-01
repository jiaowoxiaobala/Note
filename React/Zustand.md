## Zustand

>一个小型、快速且可扩展的状态管理解决方法。


## [Updating state](https://docs.pmnd.rs/zustand/guides/updating-state)

### Flat updates

>`Zustand`更新状态很简单，使用新状态调用提供的`set`函数，它将与存储中的现有状态浅层合并。

```ts
type State = {
  firstName: string
  lastName: string
}

type Action = {
  updateFirstName: (firstName: State['firstName']) => void
  updateLastName: (lastName: State['lastName']) => void
}

// Create your store, which includes both state and (optionally) actions
const useStore = create<State & Action>((set) => ({
  // 状态
  firstName: '',
  lastName: '',
  // 更新状态的方法
  updateFirstName: (firstName) => set(() => ({ firstName: firstName })),
  updateLastName: (lastName) => set(() => ({ lastName: lastName })),
}))

// In consuming app
function App() {
  // "select" the needed state and actions, in this case, the firstName value
  // and the action updateFirstName
  const [firstName, updateFirstName] = useStore(

    // 选择需要的状态和状态更新方法
    // 函数的返回值，就是useStore调用后的返回值，这里返回了一个数组，因此接收时可以解构赋值
    (state) => [state.firstName, state.updateFirstName]
  )
  
  return (
    <main>
      <label>
        First name
        <input
          // Update the "firstName" state

          // 更新状态
          onChange={(e) => updateFirstName(e.currentTarget.value)}
          value={firstName}
        />
      </label>

      <p>
        Hello, <strong>{firstName}!</strong>
      </p>
    </main>
  )
}
```

### Deeply nested object

>更新深层嵌套的对象状态。

```ts
// 正常的更新方法是复制状态对象的每个层级
// 使用spread运算符手动将其与新状态合并
normalInc: () =>
  set((state) => ({
    deep: {
      ...state.deep,
      nested: {
        ...state.deep.nested,
        obj: {
          ...state.deep.nested.obj,
          count: state.deep.nested.obj.count + 1
        }
      }
    }
  })),
}

// 使用immer缩短深层嵌套对象的状态更新
import { produce } from "immer"
immerInc: () =>
  set(produce((state: State) => { ++state.deep.nested.obj.count })),
}
```

## [Immutable state and merging ](https://docs.pmnd.rs/zustand/guides/immutable-state-and-merging)

>`set`函数更新状态时会自动合并原有的状态。(仅在第一级别（state层）合并)

```ts
import { create } from 'zustand'

const useCountStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))

// 这里更新状态时，实际是{ ...state, count: state.count + 1 }
set((state) => ({ count: state.count + 1 }))

// 而useState中则需要
const [ person, setPerson ] = useState({ name: 'bow', age: 18 })

setPerson({
  ...person,
  age: 19
})

// 对于嵌套对象状态，则需要显式合并它们
import { create } from 'zustand'

const useCountStore = create((set) => ({
  nested: { count: 0 },
  inc: () =>
    set((state) => ({
      nested: { ...state.nested, count: state.nested.count + 1 },
    })),
}))


// 可以通过给set函数第二个参数传递true，来禁用合并行为
// 如果禁用了合并行为，可能会丢弃某些数据（在旧状态中，不在新状态中的）
set((state) => newState, true)
```

## Flux inspired practice

### Recommended patterns

>推荐将程序全局状态应用于单个`Zustand`存储中，如果有一个大型应用程序，`Zustand`也支持将存储分为切片。

### Redux-like patterns

- 略，[文档指路](https://docs.pmnd.rs/zustand/guides/flux-inspired-practice#recommended-patterns)


## Auto Generating Selectors

>在使用存储中的属性或操作时，需要通过键名取值的方式，`state => state.bears`。

### create the following function: createSelectors

```ts
// 创建以下函数 createSelectors
import { StoreApi, UseBoundStore } from 'zustand'

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  let store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (let k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}

// 如果有这样一个store
interface BearState {
  bears: number
  increase: (by: number) => void
  increment: () => void
}

const useBearStoreBase = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  increment: () => set((state) => ({ bears: state.bears + 1 })),
}))

// 将createSelectors应用于store
const useBearStore = createSelectors(useBearStoreBase)

// 现在就可以直接访问它们
// get the property
const bears = useBearStore.use.bears()

// get the action
const increment = useBearStore.use.increment()

// 默认的访问
const [bears, increment] = useBearStoreBase(state => [state.bears, state.increment])
```