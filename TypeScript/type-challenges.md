# [type-challenges](https://github.com/type-challenges/type-challenges)

## easy

### Pick

>从类型`T`中选出符合`K`的属性，构造一个新的类型。

```ts
// K extends keyof T泛型约束
type MyPick<T, K extends keyof T> = {
  [k in K]: T[k]
}
```

### Readonly

>泛型 `Readonly<T>`会接收一个 泛型参数，并返回一个完全一样的类型，只是所有属性都会是只读 (readonly) 的

```ts
type MyReadonly<T> = {
  // keyof T取T的所有键值，返回一个组成的联合类型
  // in取联合类型的每一个值
  readonly [K in keyof T]: T[K]
}
```

### Tuple to Object

>传入一个元组类型，将这个元组类型转换为对象类型，这个对象类型的键/值都是从元组中遍历出来。

```typescript
// 元组[number]相当于遍历元组的每一项，组成一个联合类型
type TupleToObject<T extends readonly (string|number)[]> = {
  [K in T[number]]: K
}
```

### First of Array

>实现一个`First<T>`泛型，它接受一个数组`T`并返回它的第一个元素的类型。

```ts
type First<T extends any[]> = T extends [] ? never : T[0]

// 数组类型可以索引取值
type First<T extends any[]> = T['length'] extends 0 ? never : T[0]

type First<T extends any[]> = T extends [infer A, ...infer rest] ? A : never
```

### Length of Tuple

>创建一个`Length`泛型，这个泛型接受一个只读的元组，返回这个元组的长度

```ts
// 数组['length']返回number类型
// 元组['length']返回具体的数字字面量类型
type Length<T extends readonly unknown[]> = T['length']
```

### Exclude


### Awaited


### If


### Concat

### Includes 

>在类型系统里实现 JavaScript 的 `Array.includes` 方法，这个类型接受两个参数，返回的类型要么是 `true` 要么是 `false`。

```typescript
// 两个条件类型判断相关性的时候会判断右边部分是否相等

// 如果是两个条件类型 T1 extends U1 ? X1 : Y1 和 T2 extends U2 ? X2 : Y2 相关的话，那 T1 和 T2 相关、X1 和 X2 相关、Y1 和 Y2 相关，而 U1 和 U2 相等。

type IsEqual<T, U> = (<X>() => X extends T ? 1 : 2) extends (<X>() => X extends U ? 1 : 2) ? true : false

type Includes<T extends readonly any[], U> = T extends [infer First, ...infer Rest] ? IsEqual<First, U> extends true ? true : Includes<Rest, U> : false
```

### Push


### Unshift


### Parameters

## medium

### Get Return Type

>不使用`ReturnType`实现`TypeScript`的`ReturnType<T>`泛型。

```ts
// infer可以声明一个临时的类型"变量"
type MyReturnType<T> = T extends (...any: any[]) => infer ReturnType
  ? ReturnType
  : T
```

### Omit

不使用 `Omit` 实现 TypeScript 的 `Omit<T, K>` 泛型。`Omit` 会创建一个省略 `K` 中字段的 `T` 对象。

```typescript
type MyOmit<T extends object, KS extends keyof T> = {
  // 重映射，约束K
  [K in keyof T as K extends KS ? never : K]: T[K]
}
```

### Deep Readonly

实现一个通用的`·`DeepReadonly<T>`，它将对象的每个参数及其子对象递归地设为只读。假设在此挑战中我们仅处理对象

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

// keyof运算符会生成一个已知键的联合类型
interface Fn1 {
  (params: any): any;
}

interface Fn2 {
  (params: any): any;
  name: string;
}

// 对于函数类型的表现形式
// never
type T1 = keyof Fn1;
// 'name'
type T2 = keyof Fn1;

type DeepReadonly<T> = {
  readonly [K in keyof T]: keyof T[K] extends never ? T[K] : DeepReadonly<T[K]>;
};
```


### 4. Readonly 2

实现一个通用`MyReadonly2<T, K>`，它带有两种类型的参数`T`和`K`。`K`指定应设置为`Readonly`的`T`的属性集。如果未提供`K`，则应使所有属性都变为只读，就像普通的`Readonly<T>`一样

```typescript
// 把K中的所有属性变为只读，然后合并keyof T中所有非K子类型的属性
type MyReadonly2<T extends object, K extends keyof T = keyof T> = {
  readonly [P in K]: T[P];
} & {
  [P in keyof T as P extends K ? never : P]: T[P];
};
```


### 6. 元组转合集

实现泛型`TupleToUnion<T>`，它返回元组所有值的合集。

```typescript
// 一种思路，这个不适用于只读的元组
type TupleToUnion<T extends unknown[]> = T extends Array<infer R> ? R : T
// 按这个思路扩展
type TupleToUnion<T extends readonly any[]> = T extends readonly (infer U)[]
  ? T extends (infer R)[]
    ? R
    : U
  : never;

// T[number]用于获取元组或数组类型 T 中所有元素类型的联合类型
type TupleToUnion<T extends unknown[]> = T[number]
```



### 7. 最后一个元素

实现一个通用`Last<T>`，它接受一个数组T并返回其最后一个元素的类型

```typescript
// 类型的模式匹配是通过extends对类型参数做匹配，结果保存到通过infer声明的局部类型变量里，如果匹配就能从该局部变量里拿到提取出的类型
type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never

// 数组类型可以通过索引取指定值的类型 T[0] T['length']，另一种思路
type Last<T extends unknown[]> = [T[0], ...T][T['length']]
```



### 8. 出栈
实现一个通用`Pop<T>`，它接受一个数组T，并返回一个由数组T的前`length-1`项以相同的顺序组成的数组

```typescript
type Pop<T> = T extends [...infer Rest, infer _] ? Rest : T;
```



### 9. Type Lookup

在此挑战中，通过在联合类型`Cat | Dog`中搜索公共`type`字段来获取相应的类型

```typescript
type LookUp<U, T extends string> = U extends {
  type: T;
}
  ? U
  : never;

// 分布式条件类型：当类型参数为联合类型，并且在条件类型左边直接引用该类型参数的时候，TypeScript 会把每一个元素单独传入来做类型运算，最后再合并成联合类型
// type LookUp<U extends { type: string }, T> = U['type'] extends T ? U : never 这里不会触发分布式条件类型，因为U['type']不是直接引用的U
type LookUp<U extends { type: string }, T> = U extends U
	? U["type"] extends T
		? U
		: never
	: never;

type LookUp<U, T extends string> = {
  [K in T]: U extends { type: T } ? U : never;
}[T];
```
### 可串联构造器
在这个挑战中，你可以使用任意你喜欢的方式实现这个类型 - Interface, Type 或 Class 都行。你需要提供两个函数 option(key, value) 和 get()。在 option 中你需要使用提供的`key`和`value`扩展当前的对象类型，通过`get`获取最终结果

```typescript
type Chainable<O = {}> = {
  // K extends keyof O ? never : K限制K不能重复，Omit<O, K> & Record<K, V>如果重复了，就取后面的K,V 
  option<K extends string, V>(key: K extends keyof O  ? never : K, value: V): Chainable<Omit<O, K> & Record<K, V>>
  get(): O
}
```

### Promise.all
键入函数`PromiseAll`，它接受`PromiseLike`对象数组，返回值应为`Promise<T>`，其中T是解析的结果数组

```typescript
declare function PromiseAll<T extends unknown[]>(values: readonly [...T]):
  Promise<{ [K in keyof T]: T[K] extends Promise<infer R> ? R : T[K] }>;
```

### Trim
实现`Trim<T>`，它是一个字符串类型，并返回一个新字符串，其中两端的空白符都已被删除。

```typescript
// 匹配空格的类型
type Space = " " | "\n" | "\t";

// 去除左侧空格
type TrimLeft<T extends string> = T extends `${Space}${infer L}` ? TrimLeft<L> : T

// 去除右侧空格
type TrimRight<T extends string> = T extends `${infer R}${Space}` ? TrimRight<R> : T

// 组合在一起
type Trim<T extends string> = TrimLeft<TrimRight<T>>

// 简化
type Trim<S extends string> = S extends
  | `${Space}${infer T}`
  | `${infer T}${Space}`
  ? Trim<T>
  : S;
```

### Capitalize
实现`Capitalize<T>` 它将字符串的第一个字母转换为大写，其余字母保持原样

```typescript
// 这里的模式匹配 `${infer F}${infer R}`是把第一位子字符匹配出来，后面的R代表除第一个子字符外的所有子字符
type Capitalize<T extends string> = T extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : T;
```


### Replace
实现`Replace<S, From, To>`将字符串`S`中的第一个子字符串`From`替换为`To`。

```typescript
type Replace<S extends string, From extends string, To extends string> = 
      From extends '' 
      ? S 
      : S extends `${infer V}${From}${infer R}`
        ? `${V}${To}${R}`
        : S
```

### ReplaceAll

实现`ReplaceAll<S, From, To>`将一个字符串`S`中的所有子字符串`From`替换为`To`。

```typescript
// 加上递归即可
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer V}${From}${infer R}`
  ? ReplaceAll<`${V}${To}${R}`, From, To>
  : S;
```

### 追加参数
实现一个泛型`AppendArgument<Fn, A>`，对于给定的函数类型`Fn`，以及一个任意类型`A`，返回一个新的函数`G`。`G`拥有`Fn` 的所有参数并在末尾追加类型为`A`的参数。

```typescript
type AppendArgument<Fn extends (...args: any[]) => any, V> = Fn extends (
  // 提取Fn的所有参数的类型组成一个元组P
  ...params: infer P
) => infer R
  // 将这个元组P和类型V构造成一个新的元组类型
  ? (...params: [...P, V]) => R
  : Fn;

type AppendArgument<Fn extends (...args: any[]) => any, V> = (...params: [...Parameters<Fn>, V]) => ReturnType<Fn>
```

### Permutation
实现联合类型的全排列，将联合类型转换成所有可能的全排列数组的联合类型。

```typescript
// T extends T 触发分布式条件类型
// 假设T是1 | 2| 3, K = T = 1 | 2 | 3
// [T, ...Permutation<Exclude<K, T>] -> [1, ...Permutation<2 | 3>] -> [1, ...Permutation<2>] | [1, ...Permutation<3>]
type Permutation<T, K = T> = [T] extends [never] ? [] : T extends T ? [T, ...Permutation<Exclude<K, T>>] : never
```

### Length Of String
计算字符串的长度，类似于`String#length`

```typescript
// 思路：字符串类型取"length"是number类型，数组类型的"length"是具体的字面量数字类型
type LengthOfString<
  S extends string,
  U extends any[] = []
> = S extends `${infer F}${infer R}`
  // 先通过递归将字符串转化为数组，再通过数组的 length 属性获取数组长度
  ? LengthOfString<R, [...U, F]>
  : U["length"];
```

### Flatten
写一个接受数组的类型，并且返回扁平化的数组类型

```typescript
// 定义一个数组类型"变量"S存储扁平化的后的数组类型
type Flatten<T extends unknown[], S extends unknown[] = []> = T extends [infer F, ...infer R]
  // 遍历T，
  ? F extends unknown[]
    // 如果F是数组类型，展开F，继续递归
    ? Flatten<[...F, ...R], S>
    // 如果F不是数组类型，则添加进S
    : Flatten<R, [...S, F]>
  // 遍历结束后，返回S
  : S

type Flatten<T> = T extends []
  ? []
  // T如果是一个数组类型并且只有一个成员时，R为空数组类型，因此需要约束 extends [] ? [] : ...
  : T extends [infer F, ...infer R]
  ? [...Flatten<F>, ...Flatten<R>]
  : [T];
```

### Append to object
实现一个为接口添加一个新字段的类型。该类型接收三个参数，返回带有新字段的接口类型

```typescript
type AppendToObject<T, U extends keyof any, V> = {
  // in 遍历联合类型
  [K in keyof T | U]: K extends keyof T ? T[K]: V
}
```

### Absolute
实现一个接收`string,number或bigInt`类型参数的`Absolute`类型,返回一个正数字符串

```typescript
// 先把T转成字符串类型去匹配 -1 -> '-1'，通过字符串类型把负号提取出来
type Absolute<T extends string | number | bigint> = `${T}` extends `-${infer U}` ? U : `${T}`
```

### String to Union
实现一个将接收到的`String`参数转换为一个字母`Union`的类型

```typescript
// 遍历这个string类型，将每个子字符组成一个新的联合类型
type StringToUnion<T> = T extends `${infer F}${infer R}`
  ? F | StringToUnion<R>
  : never;
```

### Merge
将两个类型合并成一个类型，第二个类型的键会覆盖第一个类型的键

```typescript
// 思路：取出两个类型的所有键，判断这个键如果属于第二个类型就赋值第二个类型对应的键值
type Merge<T extends object, U extends object> = {
  // K in keyof T | keyoft U 也可以 K in keyoft (T & U)
  [K in keyof T | keyof U]: K extends keyof U
    ? U[K]
    : K extends keyof T
    ? T[K]
    : never;
};

type Merge<F extends object, S extends object> = {
  // 这里两个同名的key 类型不同会被合并为never，但是这里只用获取所有key
 [k in keyof (F & S)]: k extends keyof S ? S[k] : (F & S)[k]
}
```

### KebabCase

```typescript


```

### Diff
获取两个接口类型中的差值属性

```typescript
type Diff<T extends object, U extends object> = {
  [K in Exclude<keyof T, keyof U> | Exclude<keyof U, keyof T>]: (T & U)[K];
};

// 另一种思路：keyof (T | U)会取出T和U的同名键（交集）
type Diff<T extends object, U extends object> = Omit<T & U, keyof (T | U)>;
```

### AnyOf
类型接收一个数组，如果数组中任一个元素为真，则返回`true`，否则返回`false`。如果数组为空，返回 `false`。

```typescript
type AnyOf<T extends any[]> = T[number] extends
  | 0
  | ""
  | false
  | []
  | { [key: string]: never }
  ? false
  : true;
```

### IsNever
判断给定的类型是否是`never`

```typescript
type IsNever<T> = [T] extends [never] ? true : false;
```

### IsUnion
判断给定的类型是否是联合类型

```typescript
// 当类型参数为联合类型，并且在条件类型左边直接引用该类型参数的时候，TypeScript 会把每一个元素单独传入来做类型运算，最后再合并成联合类型，这种语法叫做分布式条件类型，利用这个特性可以判断联合类型
type IsUnion<A, B = A> = A extends B ? [B] extends [A] ? false : true : never

// 在条件类型中，如果左边是类型参数并且是never，则直接返回never
type IsUnion<A, B = A> = [A] extends [never] ? false : A extends B ? [B] extends [A] ? false : true : never
```

### ReplaceKeys
实现一个类型`ReplaceKeys`，它可以替换联合类型中的键名。如果某个类型没有这个键，则跳过替换

```typescript
type ReplaceKeys<T, KS, U> = T extends T
  ? {
      [K in keyof T]: K extends KS ? (K extends keyof U ? U[K] : never) : T[K];
    }
  : T;
```

### Remove Index Signature

```typescript
// to do
```

### Percentage Parser

```typescript


```

### Drop Char
从字符串中剔除指定字符

```typescript
// 模式匹配，把匹配到的指定字符递归剔除
type DropChar<
  S extends string,
  C extends string
> = S extends `${infer L}${C}${infer R}` ? DropChar<`${L}${R}`, C> : S;
```

### MinusOne
给定一个正整数作为类型的参数，要求返回的类型是该数字减 1

```typescript
// 一种思路，不支持大数值
type Pop<T extends unknown[] = []> = T extends [...infer R, infer _] ? R : T;

type MinusOne<
  Num extends number,
  T extends unknown[] = []
// 数组长度做计数，如果满足Num，就剔除数组的最后一个元素后再取"length"，不满足就递归构建
> = Num extends T["length"] ? Pop<T>["length"] : MinusOne<Num, [...T, unknown]>;

// ...
```

### PickByType
从类型`T`中选择出属性类型能分配给`U`的，构造成一个新的类型

```typescript
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};
```

### StartsWith
实现`StartsWith<T, U>`,接收两个`string`类型参数,然后判断`T`是否以`U`开头,根据结果返回`true`或`false`

```typescript
type StartsWith<T extends string, U extends string> = T extends `${U}${string}`
  ? true
  : false;
```

### EndsWith
实现`EndsWith<T, U>`,接收两个`string`类型参数,然后判断`T`是否以`U`结尾,根据结果返回`true`或`false`

```typescript
type EndsWith<T extends string, U extends string> = T extends `${string}${U}`
  ? true
  : false;
```

### PartialByKeys
实现一个通用的`PartialByKeys<T, K>`，它接收两个类型参数`T`和`K`。
`K`指定应设置为可选的`T`的属性集。当没有提供`K`时，它就和普通的`Partial<T>`一样使所有属性都是可选的

```typescript
type Copy<T> = {
  [P in keyof T]: T[P]
}

type PartialByKeys<T, K extends keyof T = keyof T> = Copy<Omit<T, K> & {
  [P in K & keyof T]?: T[P]
}>
```

### RequiredByKeys
实现一个通用的`RequiredByKeys<T, K>`，它接收两个类型参数`T`和`K`。
`K`指定应设为必选的`T`的属性集。当没有提供`K`时，它就和普通的`Required<T>`一样使所有的属性成为必选的。

```typescript
type Copy<T> = {
  [K in keyof T]: T[K];
};

type RequiredByKeys<T, K extends keyof T = keyof T> = Copy<
  Omit<T, K> & {
    [P in K]-?: T[P];
  }
>;
```

### Mutable
实现一个通用的类型`Mutable<T>`，使类型`T`的全部属性可变（非只读）

```typescript
type Mutable<T> = {
  -readonly [K in keyof T]:T[K]
}
```

### OmitByType
从类型`T`中剔除属性类型能分配给`U`的，构造成一个新的类型

```typescript
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};
```

### ObjectEntries
实现一个类型，类似`Object.entries`

```typescript
// 思路：将对象转为联合类型 -> T[keyof T] / keyof T

type ObjectEntries<T> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T];
```

### Shift
实现一个类型，类似`Array.shift`

```typescript
type Shift<T extends unknown[]> = T extends [infer First, ...infer Rest] ? Rest: T
```

### Tuple To Nested Object
给定一个仅包含字符串类型的元组类型`T`和一个类型`U`，递归构建一个对象

```typescript
type TupleToNestedObject<T, U> = T extends [infer F, ...infer Rest]
  ? {
      [K in F & string]: TupleToNestedObject<Rest, U>;
    }
  : U;
```


### Reverse
实现类型版本的数组反转`Array.reverse`

```typescript
// 当处理数量（个数、长度、层数）不固定的类型的时候，可以只处理一个类型，然后递归的调用自身处理下一个类型，直到结束条件也就是所有的类型都处理完了，就完成了不确定数量的类型编程，达到循环的效果
type Reverse<T extends unknown[]> = T extends [infer F, ...infer Rest]
  ? [...Reverse<Rest>, F]
  : T;
```

### FlipArguments
类型`FlipArguments`需要函数类型`T`，并返回一个新的函数类型，该函数类型具有与`T`相同的返回类型，但参数是反向的

```typescript
type Reverse<T extends unknown[]> = T extends [infer F, ...infer Rest]
  ? [...Reverse<Rest>, F]
  : T;

type FlipArguments<T extends (...args: any[]) => any> = T extends (
  ...args: infer Rest
) => infer R
  ? (...args: Reverse<Rest>) => R
  : T;
```

### FlattenDepth
递归地将数组展开，直到达到指定的深度

```typescript


```

### BEM style string
```typescript

```

### InorderTraversal

```typescript

```

### Flip
实现一个类型，将对象的`key`和`value`交换

```typescript
// 遍历对象对 key 进行追加变形
type Flip<T extends Record<string, string | number | boolean>> = {
  [P in keyof T as `${T[P]}`]: P;
};
```

### 斐波那契序列

```typescript

```

### AllCombinations

```typescript

```

### Greater Than

```typescript
type GreaterArr<
  N extends number,
  T extends unknown[] = []
> = T["length"] extends N ? T : GreaterArr<N, [...T, unknown]>;

// GreaterArr<B> = [unknown x B]，GreaterArr<A> = [unknown x A]
// if [unknown x B] extends [unknown x A, unknow x N] is true
// B = A + N
// B >= A
type GreaterThan<A extends number, B extends number> = GreaterArr<B> extends [
  ...GreaterArr<A>,
  ...infer _
]
  ? false
  : true;
```

### Zip
在这个挑战中，你需要实现一个类型`Zip`，其中`T`和`U`必须是元组

```typescript
type Zip<T extends unknown[], U extends unknown[]> = T extends [
  infer L,
  ...infer RestT
]
  ? U extends [infer R, ...infer RestU]
    ? [[L, R], ...Zip<RestT, RestU>]
    : []
  : [];

// 思路：构建一个二维数组去做条件类型 T extends X ? U extends Y -> [T, U] extends [X, Y]
type Zip<T extends unknown[], U extends unknown[]> = [T, U] extends [
  [infer L, ...infer RestT],
  [infer R, ...infer RestU]
]
  ? [[L, R], ...Zip<RestT, RestU>]
  : [];
```

### IsTuple
判断类型是否是元组类型

```typescript
// 元组类型的 length 是数字字面量，而数组的 length 是 number。
type a = string[]["length"]; // number

type b = [string, string]["length"]; // 2

// 排除特殊情况，条件类型左边的裸类型如果是never，就会直接返回never
type IsTuple<T> = [T] extends [never]
  ? false
  : T extends readonly any[]
  ? number extends T["length"]
    ? false
    : true
  : false;
```

### Chunk

```typescript


```

### Fill

```typescript
// 思路1：新建数组，遍历原数组，挨个添加进新数组
type Fill<
  T extends unknown[],
  N,
  Start extends number = 0,
  End extends number = T["length"],
  Count extends unknown[] = [],
  R extends unknown[] = [],
  Flag = Count["length"] extends End
    ? false
    : Count["length"] extends Start
    ? true
    : false
> = T extends [infer F, ...infer Rest]
  ? Flag extends true
    // [...Count, unknown]["length"] extends End这里是给计数加1，因为不包含End
    ? Fill<Rest, N, Start, End, [...Count, unknown], [...R, N], [...Count, unknown]["length"] extends End ? false : Flag>
    : Fill<Rest, N, Start, End, [...Count, unknown], [...R, F]>
  : R;


// 思路2：直接在原数组上修改
type Fill<
  T extends unknown[],
  N,
  Start extends number = 0,
  End extends number = T["length"],
  // 计数
  Count extends any[] = [],
  // 标识当前成员是否需要被替换
  Flag extends boolean = Count["length"] extends Start ? true : false
> = Count["length"] extends End
  ? T
  : T extends [infer R, ...infer U]
  ? Flag extends false
    // 不用替换就直接把原成员添加
    ? [R, ...Fill<U, N, Start, End, [...Count, 0]>]
    // 否则添加替换的
    : [N, ...Fill<U, N, Start, End, [...Count, 0], Flag>]
  : T;
```

### Trim Right
>实现`TrimRight<T>`，它接收确定的字符串类型并返回一个新的字符串，其中新返回的字符串删除了原字符串结尾的空白字符串

```typescript
type Space = " " | "\t" | "\n";

type TrimRight<T extends string> = T extends `${infer R}${Space}`
  ? TrimRight<R>
  : T;
```

### Without 
>接收数组类型的`T`和数字或数组类型的`U`为参数，会返回一个去除`U`中元素的数组`T`

```typescript
type ToUnion<T> = T extends any[] ? T[number] : T;

type Without<T, U> = T extends [infer R, ...infer F]
  // 如果R能够被 U 包含，那就丢弃，也就是把剩余的递归，不保留这一项
  // 如果不包含，那就用 [R, ...] 把它给留下，剩下的继续递归
  ? R extends ToUnion<U>
    ? Without<F, U>
    : [R, ...Without<F, U>]
  : T;
```

### Trunc

```typescript


```


### IndexOf
实现`Array.IndexOf`的类型版本，`indexOf<T, U>`接受数组`T`，任意`U`，并返回数组`T`中第一个`U`的索引

```typescript
type IsEqual<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B
  ? 1
  : 2
  ? true
  : false;

// 思路：构建一个元组类型R，取R的length作为索引，第一次遍历时R为空元组，length为0，以此类推
type IndexOf<T, U, R extends unknown[] = []> = T extends [
  infer F,
  ...infer Rest
]
  ? IsEqual<F, U> extends true
    ? R["length"]
    : IndexOf<Rest, U, [...R, unknown]>
  : -1;
```

### Join
实现`Array.join`的类型版本，`Join`接受一个数组类型`T`，和一个字符串或数字类型`U`，返回由`U`拼接而成的数组`T`

```typescript
// 定义一个类型"变量"R存储拼接后的字符
type Join<T, U extends string | number, R extends string = ""> = T extends [
  // 取出第一个字符
  infer F,
  ...infer Rest
]
  // 递归拼接
  ? Join<Rest, U, `${R}${R extends "" ? "" : U}${F & string}`>
  : R;

type Join<T extends any[], U extends string | number> = T extends [
  infer F,
  ...infer R
]
  ? R["length"] extends 0
    ? `${F & string}`
    : `${F & string}${U}${Join<R, U>}`
  : never;
```

### LastIndexOf
实现类型版本的`Array.lastIndexOf`, `LastIndexOf<T, U>`接受数组`T`, `any`类型`U`, 如果`U`存在于`T`中, 返回`U`在数组`T`中最后一个位置的索引, 不存在则返回`-1`

```typescript

```

### Unique
`Unique`接收数组类型`T`, 返回去重后的数组类型

```typescript
// 判断两个类型是否相等
type IsEqual<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B
  ? 1
  : 2
  ? true
  : false;

// 判断类型T（数组类型）中是否包含类型E
type Include<T, E> = T extends [infer F, ...infer R]
  ? IsEqual<F, E> extends true
    ? true
    : Include<R, E>
  : false;

// 定义一个U用于存储去重后的类型，遍历T，判断U中是否存在该类型（遍历到的），存在则“添加”进去
type Unique<T, U extends unknown[] = []> = T extends [infer F, ...infer R]
  ? Include<U, F> extends true
    ? Unique<R, U>
    : Unique<R, [...U, F]>
  : U;
```

### MapTypes

```typescript

```

### Construct Tuple
构造一个给定长度的元组。

```typescript
// 既然要构造一个数组，就需要定义一个类型“变量”作为这个数组，L为这个数组的长度
type ConstructTuple<
  L extends number,
  T extends unknown[] = []
  // 递归判断，只要T['length']不满足L，就追加元素
> = T["length"] extends L ? T : ConstructTuple<L, [...T, unknown]>;
```

### Number Range
>实现一个类型`NumberRange`，接受两个数字类型`L`,`T`，取出`L`和`T`之间的数（包含它们本身。

```ts
type NewArray<L extends number, T extends number[] = []> = T["length"] extends L
  ? T
  : NewArray<L, [...T, 0]>;

type Decrease<N extends number> = NewArray<N> extends [0, ...infer R]
  ? R["length"]
  : N;

// 减法的思路：不断用H联合H - 1，直到L和H"相等"
type NumberRange<L extends number, H extends number> = L extends H
  ? L | H
  : NumberRange<L, H | Decrease<H>>;


// 加法的思路，因为H是大于L的，定义一个数组T，每次给T的长度+1，当T的长度"等于"L时，每次把T的长度添加进U
type NumberRange<
  L extends number,
  H extends number,
  T extends number[] = [],
  U extends number[] = [],
  // 由于不知道T的长度什么时候"等于"L，定义一个布尔值类型Flag，做标记
  Flag = T["length"] extends L ? true : false
> = Flag extends true
  ? // T的长度"等于"H时，结束递归
    T["length"] extends H
    ? T["length"] | U[number]
    : NumberRange<L, H, [...T, 0], [...U, T["length"]], Flag>
  : NumberRange<L, H, [...T, 0]>;
```

### Combination
>把多个修饰键两两组合，但不可以出现相同的修饰键组合。提供的`ModifierKeys`中，前面的值比后面的值高。

```ts
// never会被联合类型过滤，所以U的默认值给到never
type Combs<T extends string[], U = never> = T extends [
  infer F extends string,
  ...infer R extends string[]
]
  ? // 当遍历到最后一个元素时，R为空数组，空数组[number]为never
    // 此时`${F} ${R[number]}`为`${最后一个元素类型} ${never}`，与never组成模板字符串类型时会返回never
    Combs<R, U | `${F} ${R[number]}`>
  : U;

// 另一种解法：不声明类型变量
type Combs<T extends string[]> = T extends [
  infer F extends string,
  ...infer R extends string[]
]
  ? `${F} ${R[number]}` | Combs<R>
  : never;
```


### Subsequence
todo



### CheckRepeatedChars
>判断一个`string`类型中是否有相同的字符

```typescript
type CheckRepeatedChars<T extends string> =
  // 匹配第一个子字符X和后面所有的子字符Y
  T extends `${infer X}${infer Y extends string}`
    ? // 通过字符Y去匹配是否存在子字符X，如果存在则有重复
      Y extends `${infer A}${X}${infer B}`
      ? true
      : CheckRepeatedChars<Y>
    : false;
```


### GetMiddleElement
>通过实现一个`GetMiddleElement`方法，获取数组的中间元素，用数组表示。如果数组的长度为奇数，则返回中间一个元素 如果数组的长度为偶数，则返回中间两个元素

```ts
// 思路：遍历数组不断去掉开头和结尾的两个成员
type GetMiddleElement<T extends unknown[]> = T extends [
  infer F,
  ...infer R,
  infer L
]
  ? // 当R为空数组时，T的长度为偶数，此时[F,L]就是中间两个成员
    R["length"] extends 0
    ? [F, L]
    : // 当R无法匹配[infer F, ...infer R, infer L]时，证明T是奇数长度，此时R为中间那个元素
      GetMiddleElement<R>
  : T;


type GetMiddleElement<T extends any[]> = T["length"] extends 0 | 1 | 2
  ? T
  : T extends [any, ...infer M, any]
  ? GetMiddleElement<M>
  : never;
```


### Appear only once

>找出目标数组中只出现过一次的元素。例如：输入[1,2,2,3,3,4,5,6,6,6]，输出[1,4,5]

```ts
// 声明两个类型变量，U存储重复的成员，S存储不重复的成员
type FindEles<
  T extends unknown[],
  U extends unknown[] = [],
  S extends unknown[] = []
> = T extends [infer F, ...infer R]
  ? // 因为每次遍历都会去掉一个成员，所以需要判断这个成员在不在R和U中
    // 假设T = [1, 1, 2]，遍历到第2个1时，F = 1, R = [2]，U = [1]
    F extends [...R, ...U][number]
    ? FindEles<R, [...U, F], S>
    : FindEles<R, U, [...S, F]>
  : S;


// 另一种思路：把重复的元素不断组合成联合类型Duplicates
type FindEles<T extends unknown[], Duplicates = never> = T extends [
  infer F,
  ...infer R
]
  ? F extends Duplicates
    ? FindEles<R, Duplicates>
    : F extends R[number]
    ? FindEles<R, Duplicates | F>
    : [F, ...FindEles<R, Duplicates>]
  : [];
```

### Integer 
>请完成类型`Integer<T>`，类型`T`继承于`number`，如果`T`是一个整数则返回它，否则返回`never`

```ts
// 思路：转成字符串类型去匹配是否存在小数点
type Integer<T extends string | number> = number extends T
  ? never
  : `${T}` extends `${string}.${string}`
  ? never
  : T;
```

### ToPrimitive 
todo

### DeepMutable
深度可修改，与深度只读相反

```ts
// keyof (...arg: any) => any为never，这里过滤掉函数类型
type DeepMutable<T extends Record<keyof any, any>> = keyof T extends never
  ? T
  : {
      -readonly [K in keyof T]: DeepMutable<T[K]>;
    };
```

### All
如果列表中的所有元素都等于传入的第二个参数，则返回`true`，如果有任何不匹配则返回`false`

```typescript
type IsEqual<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B
  ? 1
  : 2
  ? true
  : false;

// 思路：构建两个类型"变量"，TLen存T的长度，R存每次递归满足条件的成员
type All<
  T extends unknown[],
  U,
  TLen = T["length"],
  R extends unknown[] = []
> = T extends [infer F, ...infer Rest]
  ? // 如果有一个成员与U不相等，则直接返回false
    IsEqual<F, U> extends true
    ? // 否则添加进R
      All<Rest, U, TLen, [...R, unknown]>
    : false
  : // 递归结束时，比较原先T的长度和R的长度
    IsEqual<R["length"], TLen>;
```

### Filter 

```typescript
// 思路：定义一个类型"变量"U存储符合条件的成员
type Filter<T extends any[], P, U extends unknown[] = []> = T extends [
  infer F,
  ...infer Rest
]
  ? F extends P
    ? Filter<Rest, P, [...U, F]>
    : Filter<Rest, P, U>
  : U;

// 思路2：直接在原数组上修改
type Filter<T extends unknown[], P> = T extends [infer F, ...infer R]
  ? F extends P
    ? [F, ...Filter<R, P>]
    : Filter<R, P>
  : [];
```


### ReplaceFirst

>实现类型`ReplaceFirst<T, S, R>`，它将用`R`替换元组`T`中第一次出现的`S`。如果`T`中不存在这样的`S`，则结果应为`T`。

```typescript
type ReplaceFirst<
  T extends readonly unknown[],
  S,
  R,
  U extends unknown[] = []
> = T extends [infer F, ...infer Rest]
  ? F extends S
    ? // 找到满足的第一个S时，此时U为前面遍历的所有成员，Rest为还未遍历的所有成员
      [...U, R, ...Rest]
    : // 把每次遍历的成员不符合R的存进U
      ReplaceFirst<Rest, S, R, [...U, F]>
  : U;

// 另一种解法
type ReplaceFirst<T extends readonly unknown[], S, R> = T extends readonly [
  infer F,
  ...infer Rest
]
  ? F extends S
    ? [R, ...Rest]
    : [F, ...ReplaceFirst<Rest, S, R>]
  : [];
```
### Transpose
>

```ts
type Array<N extends number, T extends unknown[] = []> = T["length"] extends N
  ? T
  : Array<N, [...T, unknown]>;

type AddOne<N extends number> = [
  unknown,
  ...Array<N>
] extends infer R extends unknown[]
  ? R["length"]
  : N;

type GetArrayByIndex<
  N extends number,
  T extends unknown[][],
  U extends unknown[] = []
> = T extends [infer F extends unknown[], ...infer R extends unknown[][]]
  ? GetArrayByIndex<N, R, [...U, F[N]]>
  : U;

type Transpose<
  T extends unknown[][],
  L extends number = 0,
  U extends unknown[] = []
> = U["length"] extends T[0]["length"]
  ? U
  : T extends [infer F extends unknown[], ...infer R extends unknown[][]]
  ? Transpose<T, AddOne<L>, [...U, [F[L], ...GetArrayByIndex<L, R>]]>
  : U;


// 另一种思路
type Transpose<M extends number[][],R = M['length'] extends 0?[]:M[0]> = {
  [X in keyof R]: {
    [Y in keyof M]: X extends keyof M[Y] ? M[Y][X] :never
  }
}
```

### JSON Schema to TypeScript
todo

### Square
>给定一个数组，返回它的平方。

```ts
type Abs<N extends number> = `${N}` extends `-${infer T extends number}`
  ? T
  : N;

type NewArray<
  N extends number,
  T extends unknown[] = []
> = T["length"] extends N ? T : NewArray<N, [...T, unknown]>;

type Decrease<N extends number> = NewArray<N> extends [unknown, ...infer R]
  ? R["length"]
  : N;

// 3^2 = 3 * 3 = 3 + 3 + 3
type Square<
  N extends number,
  S extends number = Abs<N>,
  U extends unknown[] = []
> = Abs<N> extends 0
  ? U["length"]
  : Square<Decrease<Abs<N>>, S, [...U, ...NewArray<S>]>;
```


### Triangular number

```ts
// 减法的思路
type NewArr<N extends number, T extends unknown[] = []> = T["length"] extends N
  ? T
  : NewArr<N, [...T, unknown]>;

type Decrease<N extends number> = NewArr<N> extends [unknown, ...infer R]
  ? R["length"]
  : N;

type Triangular<N extends number, T extends unknown[] = []> = N extends 0
  ? T["length"]
  : Triangular<Decrease<N>, [...T, ...NewArr<N>]>;

// 加法的思路
type Triangular<
  N extends number,
  P extends unknown[] = [],
  A extends unknown[] = []
// 构建出长度为N的数组P
> = P["length"] extends N
  ? A["length"]
  // 每次不满足就给P加一个unkown，即长度+1，然后把P添加进A
  : Triangular<N, [...P, unknown], [...A, ...P, unknown]>;
```

### CartesianProduct

```ts
// Union<2 | 3> -> [2] | [3]
type Union<T> = T extends T ? [T] : never;

// [1, ...Union<2 | 3>] -> [1, 2] | [1, 3]
type CartesianProduct<T, U> = T extends T ? [T, ...Union<U>] : never;


// 另一种思路
type CartesianProduct<T, U> = T extends T
  ? U extends U
    ? [T, U]
    : never
  : never;
```

### MergeAll

>合并两个对象，如果键重叠，则将键值合并成一个联合类型。

```ts
// merge two objects
type MergeObj<T, U> = {
  [K in keyof T | keyof U]: K extends keyof T
    ? K extends keyof U
      ? T[K] | U[K]
      : T[K]
    : K extends keyof U
    ? U[K]
    : never;
};

// O stores merged object
type MergeAll<T, O = {}> = T extends [infer F, ...infer R]
  ? // loop merge F and O
    MergeAll<R, MergeObj<F, O>>
  : O;
```



### CheckRepeatedTuple
>判断一个元组类型中是否有相同的成员。

```typescript
type IsEqual<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B
  ? 1
  : 2
  ? true
  : false;

type Includes<T extends unknown[], U> = T extends [infer F, ...infer Rest]
  ? IsEqual<F, U> extends true
    ? true
    : Includes<Rest, U>
  : false;

// number extends T['length']排除非元组类型，因为T有可能是string[]
// type arr1 = string[] -> arr1['length'] -> number
// type arr2 = [string] -> arr2['length'] -> 1
type CheckRepeatedTuple<T extends unknown[]> = number extends T["length"]
  ? false
  : // 遍历T，每次取出第一项
  T extends [infer F, ...infer Rest]
  ? // 判断后面的所有成员中是否有与第一项相等的
    Includes<Rest, F> extends true
    ? true
    : // 如果没有，继续递归后面的所有成员，此时第一项可以排除了
      CheckRepeatedTuple<Rest>
  : false;

// 另一种解法
type CheckRepeatedTuple<T extends unknown[]> = T extends [infer L, ...infer R]
  ? L extends R[number]
    ? true
    : CheckRepeatedTuple<R>
  : false;
```