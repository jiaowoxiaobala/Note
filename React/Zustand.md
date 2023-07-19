文档目录结构保持和官方文档一致，例子全部来自官网。

## Zustand

>一个小型、快速且可扩展的状态管理解决方法。


## [Updating state](https://docs.pmnd.rs/zustand/guides/updating-state)

### Flat updates

>`Zustand`更新状态很简单，使用新状态调用提供的`set`函数，它将与存储中的现有状态浅层合并。

```tsx
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

```tsx
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

```tsx
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

## [Flux inspired practice](https://docs.pmnd.rs/zustand/guides/flux-inspired-practice)

### Recommended patterns

>推荐将程序全局状态应用于单个`Zustand`存储中，如果有一个大型应用程序，`Zustand`也支持将存储分为切片。

### Redux-like patterns

- 略，[文档指路](https://docs.pmnd.rs/zustand/guides/flux-inspired-practice#recommended-patterns)


## [Auto Generating Selectors](https://docs.pmnd.rs/zustand/guides/auto-generating-selectors)

>在使用存储中的属性或操作时，需要通过键名取值的方式，`state => state.bears`，可以借助工具函数简化。

### create the following function: createSelectors

```tsx
// 创建以下函数 createSelectors
import { StoreApi, UseBoundStore } from "zustand";

type State = Record<keyof any, any>;

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

const createSelectors = <S extends UseBoundStore<StoreApi<State>>>(
  _store: WithSelectors<S>
) => {
  const store = _store;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    store.use[k] = () => store((s) => s[k]);
  }

  return store;
};

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

## [Practice with no store actions](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)

>推荐在存储中并置状态和状态更新方法（将状态和操作放在一起）。

```tsx
// 例如这样创建一个包含数据和操作的独立存储
export const useBoundStore = create((set) => ({
  // 状态
  count: 0,
  text: 'hello',

  // 状态更新方法
  inc: () => set((state) => ({ count: state.count + 1 })),
  setText: (text) => set({ text }),
}))


// 另一种是在存储外部的模块级别定义操作（状态更新方法）
export const useBoundStore = create(() => ({
  count: 0,
  text: 'hello',
}))

export const inc = () =>
  //  用setState更新状态
  useBoundStore.setState((state) => ({ count: state.count + 1 }))

export const setText = (text) => useBoundStore.setState({ text })
```

## [TypeScript Guide](https://docs.pmnd.rs/zustand/guides/typescript)

## [Map and Set Usage](https://docs.pmnd.rs/zustand/guides/maps-and-sets-usage)

>使用`Map`或`Set`作状态存储时需要包裹在对象里，然后使用`setState`更新。

```tsx
import { create } from 'zustand'

// Without wrapping it in an object, it doesn't work.
const useTheWrongWay = create(() => new Set());

const useFooBar = create(() => ({ foo: new Map(), bar: new Set() }))

function doSomething() {
  // doing something...

  // If you want to update some React component that uses `useFooBar`, you have to call setState
  // to let React know that an update happened.
  // Following React's best practices, you should create a new Map/Set when updating them:
  useFooBar.setState((prev) => ({
    foo: new Map(prev.foo).set('newKey', 'newValue'),
    bar: new Set(prev.bar).add('newKey'),
  }))
}
```

## [How to reset state](https://docs.pmnd.rs/zustand/guides/how-to-reset-state)

>重置初始状态。

```tsx
import { create } from 'zustand'

// define types for state values and actions separately
type State = {
  salmon: number
  tuna: number
}

type Actions = {
  addSalmon: (qty: number) => void
  addTuna: (qty: number) => void
  reset: () => void
}

// 将初始状态单独提取出来
// define the initial state
const initialState: State = {
  salmon: 0,
  tuna: 0,
}

// create store
const useSlice = create<State & Actions>()((set, get) => ({
  ...initialState,

  addSalmon: (qty: number) => {
    set({ salmon: get().salmon + qty })
  },

  addTuna: (qty: number) => {
    set({ tuna: get().tuna + qty })
  },

  // 定义reset方法，更新状态
  reset: () => {
    set(initialState)
  },
}))
```

>重置多个`store`的初始状态。

```tsx
import { create as _create, StateCreator } from 'zustand'

// 保存重置初始状态方法的数组
const resetters: (() => void)[] = []

// 扩展zustand的create方法
export const create = (<T extends unknown>(f: StateCreator<T> | undefined) => {
  if (f === undefined) return create
  const store = _create(f)

  // 获取store的初始状态
  const initialState = store.getState()
  resetters.push(() => {
    store.setState(initialState, true)
  })
  return store
}) as typeof _create

export const resetAllStores = () => {
  for (const resetter of resetters) {
    resetter()
  }
}
```

>切片模式下的重置初始状态。

```tsx
import create, { StateCreator } from 'zustand'

const resetters: (() => void)[] = []

const initialBearState = { bears: 0 }

interface BearSlice {
  bears: number
  addBear: () => void
  eatFish: () => void
}

const createBearSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  BearSlice
// 这里接收create传入的参数
> = (set) => {
  resetters.push(() => set(initialBearState))
  return {
    ...initialBearState,
    addBear: () => set((state) => ({ bears: state.bears + 1 })),
    eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
  }
}

const initialStateFish = { fishes: 0 }

interface FishSlice {
  fishes: number
  addFish: () => void
}

const createFishSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  FishSlice
> = (set) => {
  resetters.push(() => set(initialStateFish))
  return {
    ...initialStateFish,
    addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
  }
}

// 切片模式
const useBoundStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))

export const resetAllSlices = () => resetters.forEach((resetter) => resetter())

export default useBoundStore
```

## [Initialize state with props](https://docs.pmnd.rs/zustand/guides/initialize-state-with-props)


## [Slices Pattern](https://docs.pmnd.rs/zustand/guides/slices-pattern)

>可以将`store`切割成一些小的`store`来实现模块化。

```tsx
import { create } from 'zustand'

const createFishSlice = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

const createBearSlice = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
})

// 将这两个store合并成一个
export const useBoundStore = create((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),

  // 可以在单个函数中更新多个切片store
  addBearAndFish: () => {
    createBearSlice(set).addBear()
    createFishSlice(set).addFish()
  },
}))


// 在组件中使用
import { useBoundStore } from './stores/useBoundStore'

function App() {
  const bears = useBoundStore((state) => state.bears)
  const fishes = useBoundStore((state) => state.fishes)
  const addBear = useBoundStore((state) => state.addBear)
  return (
    <div>
      <h2>Number of bears: {bears}</h2>
      <h2>Number of fishes: {fishes}</h2>
      <button onClick={() => addBear()}>Add a bear</button>
    </div>
  )
}
```