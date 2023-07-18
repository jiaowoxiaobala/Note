# [type-challenges](https://github.com/type-challenges/type-challenges)

## easy

### Pick

>从类型`T`中选出符合`K`的属性，构造一个新的类型。

```ts
// K extends keyof T泛型约束：K是T的键
type MyPick<T, K extends keyof T> = {
  [k in K]: T[k]
}
```

### Readonly

>泛型 `Readonly<T>`会接收一个 泛型参数，并返回一个完全一样的类型，只是所有属性都会是只读 (readonly) 的

```ts
type MyReadonly<T> = {
  // keyof T：取T的所有键，返回一个联合类型
  // in取联合类型的每一项
  readonly [K in keyof T]: T[K]
}
```

### Tuple to Object

>传入一个元组类型，将这个元组类型转换为对象类型，这个对象类型的键/值都是从元组中遍历出来。

```typescript
// 元组[number]相当于遍历元组的每一项，组成一个联合类型
type TupleToObject<T extends readonly (string | number)[]> = {
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

>实现内置的`Exclude<T, U>`类型。

```ts
// 当条件类型左边泛型参数是联合类型时会触发分布式条件类型
// MyExclude<1 | 2, 1> -> MyExclude<1, 1> | MyExclude<2, 1>
type MyExclude<T, U> = T extends U ? never : T
```

### Awaited

>假如我们有一个`Promise`对象，这个`Promise`对象会返回一个类型。在`TS`中，我们用`Promise`中的`T` 来描述这个`Promise`返回的类型。请你实现一个类型，可以获取这个类型。

```ts
type PromiseLike<T> = {
  then: (onfulfilled: (arg: T) => unknown) => unknown
}

// 用infer推导出Promise的参数类型，如果推导出来的仍然是Promise，则递归
type MyAwaited<T extends Promise<unknown> | PromiseLike<unknown>> = T extends PromiseLike<infer U>
  ? U extends PromiseLike<any>
    ? MyAwaited<U>
    : U
  : T
```

### If

>实现一个`IF`类型，它接收一个条件类型`C` ，一个判断为真时的返回类型`T` ，以及一个判断为假时的返回类型`F`。 `C`只能是`true`或者`false`， `T`和`F`可以是任意类型。

```ts
type If<C extends boolean, T, F> = C extends true ? T : F
```


### Concat

>在类型系统里实现`JavaScript`内置的`Array.concat`方法，这个类型接受两个参数，返回的新数组类型应该按照输入参数从左到右的顺序合并为一个新的数组。

```ts
// TS中也可以通过JS中的扩展运算符，把数组类型平铺
type Concat<T extends readonly unknown[], U extends readonly unknown[]> = [...T, ...U]
```

### Includes 

>在类型系统里实现 JavaScript 的 `Array.includes` 方法，这个类型接受两个参数，返回的类型要么是 `true` 要么是 `false`。

```typescript
// 两个条件类型判断相关性的时候会判断右边部分是否相等

// 如果是两个条件类型 T1 extends U1 ? X1 : Y1 和 T2 extends U2 ? X2 : Y2 相关的话，那 T1 和 T2 相关、X1 和 X2 相关、Y1 和 Y2 相关，而 U1 和 U2 相等。

type IsEqual<T, U> = (<X>() => X extends T ? 1 : 2) extends (<X>() => X extends U ? 1 : 2) ? true : false

type Includes<T extends readonly any[], U> = T extends [infer First, ...infer Rest]
  ? IsEqual<First, U> extends true
    ? true
    : Includes<Rest, U>
  : false
```

### Push

>在类型系统里实现通用`Array.push`。

```ts
// 平铺数组类型T，再把U加到后面
type Push<T extends unknown[], U> = [...T, U]
```

### Unshift

>实现类型版本的`Array.unshift`。

```ts
// 平铺数组类型T，再把U加到前面
type Unshift<T extends unknown[], U> = [U, ...T]
```

### Parameters

>实现内置的`Parameters`类型。

```ts
// 通过infer推导出参数的类型
type MyParameters<T extends (...args: any[]) => any> = T extends (...args: infer U) => any ? U : T
```

## medium

### Get Return Type

>不使用`ReturnType`实现`TypeScript`的`ReturnType<T>`泛型。

```ts
// infer可以声明一个临时的类型"变量", 通过infer推导出返回值的类型
type MyReturnType<T> = T extends (...any: any[]) => infer ReturnType
  ? ReturnType
  : T
```

### Omit

>不使用 `Omit` 实现 TypeScript 的 `Omit<T, K>` 泛型。`Omit` 会创建一个省略 `K` 中字段的 `T` 对象。

```typescript
type MyOmit<T extends object, KS extends keyof T> = {
  // 重映射，约束K，如果K不是KS的子类型，则舍弃
  [K in keyof T as K extends KS ? never : K]: T[K]
}
```

### Readonly 2

>实现一个通用`MyReadonly2<T, K>`，它带有两种类型的参数`T`和`K`。`K`指定应设置为`Readonly`的`T`的属性集。如果未提供`K`，则应使所有属性都变为只读，就像普通的`Readonly<T>`一样。

```typescript
// 把K中的所有属性变为只读，然后合并keyof T中所有非K子类型的属性
type MyReadonly2<T extends object, K extends keyof T = keyof T> = {
  readonly [P in K]: T[P];
} & {
  [P in keyof T as P extends K ? never : P]: T[P];
};
```

### Deep Readonly

>实现一个通用的`·`DeepReadonly<T>`，它将对象的每个参数及其子对象递归地设为只读。假设在此挑战中我们仅处理对象。

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
}

// 另一种解法：
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

### Tuple to Union

>实现泛型`TupleToUnion<T>`，它返回元组所有值的合集。

```typescript
// 一种思路，这个不适用于只读的元组
type TupleToUnion<T extends unknown[]> = T extends Array<infer R> ? R : T

// 按这个思路扩展
type TupleToUnion<T extends readonly any[]> = T extends readonly (infer U)[]
  ? T extends (infer R)[]
    ? R
    : U
  : never;

// 另一种解法：
// T[number]用于获取元组或数组类型 T 中所有元素类型的联合类型
type TupleToUnion<T extends unknown[]> = T[number]
```

### Chainable Options
>在这个挑战中，你可以使用任意你喜欢的方式实现这个类型 - `Interface, Type` 或`Class`都行。你需要提供两个函数`option(key, value)`和`get()`。在`option`中你需要使用提供的`key`和`value`扩展当前的对象类型，通过`get`获取最终结果。

```typescript
type Chainable<O = {}> = {
  // K extends keyof O ? never : K限制K不能重复，Omit<O, K> & Record<K, V>如果重复了，就取后面的K,V 
  option<K extends string, V>(key: K extends keyof O  ? never : K, value: V): Chainable<Omit<O, K> & Record<K, V>>
  get(): O
}
```

### Last of Array

>实现一个通用`Last<T>`，它接受一个数组T并返回其最后一个元素的类型。

```typescript
// 类型的模式匹配是通过extends对类型参数做匹配，结果保存到通过infer声明的局部类型变量里，如果匹配就能从该局部变量里拿到提取出的类型
type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never

// 另一种思路：构造一个长度+1的数组，取T['length']
type Last<T extends unknown[]> = [any, ...T][T['length']]
```


### Pop
>实现一个通用`Pop<T>`，它接受一个数组T，并返回一个由数组T的前`length-1`项以相同的顺序组成的数组。

```typescript
// infer _表示TS可以忽视这个临时类型变量
type Pop<T> = T extends [...infer Rest, infer _] ? Rest : T;
```

### Promise.all
>键入函数`PromiseAll`，它接受`PromiseLike`对象数组，返回值应为`Promise<T>`，其中T是解析的结果数组。

```typescript
declare function PromiseAll<T extends unknown[]>(values: readonly [...T]):
  Promise<{ [K in keyof T]: T[K] extends Promise<infer R> ? R : T[K] }>;
```

### Type Lookup

>通过在联合类型`Cat | Dog`中搜索公共`type`字段来获取相应的类型

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

### Trim Left

>实现`TrimLeft<T>`，它接收确定的字符串类型并返回一个新的字符串，其中新返回的字符串删除了原字符串开头的空白字符串。

```ts
// 匹配空格的类型
type Space = " " | "\n" | "\t";

// 去除左侧空格
type TrimLeft<T extends string> = T extends `${Space}${infer L}` ? TrimLeft<L> : T
```

### Trim
>实现`Trim<T>`，它是一个字符串类型，并返回一个新字符串，其中两端的空白符都已被删除。

```typescript
// 匹配空格的类型
type Space = " " | "\n" | "\t";

// 去除左侧空格
type TrimLeft<T extends string> = T extends `${Space}${infer L}` ? TrimLeft<L> : T

// 去除右侧空格
type TrimRight<T extends string> = T extends `${infer R}${Space}` ? TrimRight<R> : T

// 组合在一起
type Trim<T extends string> = TrimLeft<TrimRight<T>>

// 另一种解法：
type Trim<S extends string> = S extends
  | `${Space}${infer T}`
  | `${infer T}${Space}`
  ? Trim<T>
  : S;
```

### Capitalize
>实现`Capitalize<T>` 它将字符串的第一个字母转换为大写，其余字母保持原样

```typescript
// 这里的模式匹配 `${infer F}${infer R}`是把第一位子字符匹配出来，后面的R代表除第一个子字符外的所有子字符
type Capitalize<T extends string> = T extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : T;
```


### Replace
>实现`Replace<S, From, To>`将字符串`S`中的第一个子字符串`From`替换为`To`。

```typescript
type Replace<S extends string, From extends string, To extends string> = 
      From extends '' 
      ? S 
      : S extends `${infer V}${From}${infer R}`
        ? `${V}${To}${R}`
        : S
```

### ReplaceAll

>实现`ReplaceAll<S, From, To>`将一个字符串`S`中的所有子字符串`From`替换为`To`。

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

### Append Argument

>实现一个泛型`AppendArgument<Fn, A>`，对于给定的函数类型`Fn`，以及一个任意类型`A`，返回一个新的函数`G`。`G`拥有`Fn` 的所有参数并在末尾追加类型为`A`的参数。

```typescript
type AppendArgument<Fn extends (...args: any[]) => any, V> = Fn extends (
  // 提取Fn的所有参数的类型组成一个元组P
  ...params: infer P
) => infer R
  // 将这个元组P和类型V构造成一个新的元组类型
  ? (...params: [...P, V]) => R
  : Fn;

// 另一种解法：
type AppendArgument<Fn extends (...args: any[]) => any, V> = (...params: [...Parameters<Fn>, V]) => ReturnType<Fn>
```

### Permutation
>实现联合类型的全排列，将联合类型转换成所有可能的全排列数组的联合类型。

```typescript
// T extends T 触发分布式条件类型
// 假设T是1 | 2| 3, K = T = 1 | 2 | 3
// [T, ...Permutation<Exclude<K, T>] -> [1, ...Permutation<2 | 3>] -> [1, ...Permutation<2>] | [1, ...Permutation<3>]
type Permutation<T, K = T> = [T] extends [never] ? [] : T extends T ? [T, ...Permutation<Exclude<K, T>>] : never
```

### Length Of String
>计算字符串的长度，类似于`String#length`。

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
>写一个接受数组的类型，并且返回扁平化的数组类型。

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

// 另一种解法
type Flatten<T> = T extends []
  ? []
  // T如果是一个数组类型并且只有一个成员时，R为空数组类型，因此需要约束 extends [] ? [] : ...
  : T extends [infer F, ...infer R]
  ? [...Flatten<F>, ...Flatten<R>]
  : [T];
```

### Append to object
>实现一个为接口添加一个新字段的类型。该类型接收三个参数，返回带有新字段的接口类型。

```typescript
type AppendToObject<T, U extends keyof any, V> = {
  // 取出T的所有键名 联合U
  [K in keyof T | U]: K extends keyof T ? T[K]: V
}
```

### Absolute
>实现一个接收`string,number或bigInt`类型参数的`Absolute`类型,返回一个正数字符串。

```typescript
// 先把T转成字符串类型去匹配 -1 -> '-1'，通过字符串类型把负号提取出来
type Absolute<T extends string | number | bigint> = `${T}` extends `-${infer U}` ? U : `${T}`
```

### String to Union
>实现一个将接收到的`String`参数转换为一个字母`Union`的类型

```typescript
// 遍历这个string类型，将每个子字符组成一个新的联合类型
type StringToUnion<T> = T extends `${infer F}${infer R}`
  ? F | StringToUnion<R>
  : never;
```

### Merge
>将两个类型合并成一个类型，第二个类型的键会覆盖第一个类型的键。

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

// 另一种解法
type Merge<F extends object, S extends object> = {
  // 这里两个同名的key 类型不同会被合并为never，但是这里只用获取所有key
 [k in keyof (F & S)]: k extends keyof S ? S[k] : (F & S)[k]
}
```

### KebabCase

>把`KebabCase`这种字符串转成`kebab-case`。

```ts
// 思路：遍历每一项子字符，判断是否是小写
type KebabCase<
  S extends string,
  Res extends string = ""
> = S extends `${infer F}${infer R}`
  // 如果满足小写
  ? F extends Uncapitalize<F>
    ? KebabCase<R, `${Res}${F}`>
    : KebabCase<R, `${Res}${Res extends "" ? "" : "-"}${Lowercase<F>}`>
  : Res;

// 另一种思路：
// 这里的S extends `${infer S1}${infer S2}`是匹配第一个子字符S1和后面的所有子字符S2
type KebabCase<S extends string> = S extends `${infer S1}${infer S2}`
  ? // S2是否满足小写开头
    S2 extends Uncapitalize<S2>
    ? // 每次都把第一个子字符转小写
      `${Uncapitalize<S1>}${KebabCase<S2>}`
    : // S2是大写开头，拼接-
      `${Uncapitalize<S1>}-${KebabCase<S2>}`
  : S;
```

### Diff
>获取两个接口类型中的差值属性。

```typescript
type Diff<T extends object, U extends object> = {
  [K in Exclude<keyof T, keyof U> | Exclude<keyof U, keyof T>]: (T & U)[K];
};

// 另一种思路：keyof (T | U)会取出T和U的同名键（交集）
type Diff<T extends object, U extends object> = Omit<T & U, keyof (T | U)>;
```

### AnyOf
>类型接收一个数组，如果数组中任一个元素为真，则返回`true`，否则返回`false`。如果数组为空，返回 `false`。

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
>判断给定的类型是否是`never`。

```typescript
// 如果条件类型左边是类型参数，并且传入的是 never，那么直接返回 never，因此需要[]包裹
type IsNever<T> = [T] extends [never] ? true : false;
```

### IsUnion
>判断给定的类型是否是联合类型。

```typescript
// 当类型参数为联合类型，并且在条件类型左边直接引用该类型参数的时候，TypeScript 会把每一个元素单独传入来做类型运算，最后再合并成联合类型，这种语法叫做分布式条件类型，利用这个特性可以判断联合类型
type IsUnion<A, B = A> = A extends B ? [B] extends [A] ? false : true : never

// 在条件类型中，如果左边是类型参数并且是never，则直接返回never
type IsUnion<A, B = A> = [A] extends [never] ? false : A extends B ? [B] extends [A] ? false : true : never
```

### ReplaceKeys
>实现一个类型`ReplaceKeys`，它可以替换联合类型中的键名。如果某个类型没有这个键，则跳过替换。

```typescript
type ReplaceKeys<T, KS, U> = T extends T
  ? {
      [K in keyof T]: K extends KS ? (K extends keyof U ? U[K] : never) : T[K];
    }
  : T;
```

### Remove Index Signature

>去除对象类型的索引签名。

```ts
// 思路：判断索引string | number | symbol的子类型，不能直接是string | number | symbol类型
type RemoveIndexSignature<T> = {
  [k in keyof T as string extends k
    ? never
    : number extends k
    ? never
    : symbol extends k
    ? never
    : k]: T[k];
};

// 另一种写法
// PropertyKey -> string | number | symbo
type RemoveIndexSignature<T, P = PropertyKey> = {
  // as索引重映射
  // string extends K ? never : K extends string ? K : never
  // number extends K ? never : K extends number ? K : never
  // symbol extends K ? never : K extends symbol ? K : never
  [K in keyof T as P extends K ? never : K extends P ? K : never]: T[K];
};
```

### Percentage Parser


>实现类型`PercentageParser`。根据规则`/^(\+|\-)?(\d*)?(\%)?$/`匹配类型`T`。匹配的结果由三部分组成，分别是：[正负号, 数字, 单位]，如果没有匹配，则默认是空字符串。

```ts
type PercentageParser<S extends string> = S extends `${infer L}${infer R}`
  ? // 匹配出第一个字符L是否匹配'-' | '+'
    L extends "-" | "+"
    // 后面的所有子字符是否匹配`${infer U}%`
    ? R extends `${infer U}%`
      ? [L, U, "%"]
      : [L, R, ""]
    // 第一个子字符不匹配'-' | '+'，判断S是否匹配`${infer U}%`
    : S extends `${infer U}%`
    ? ["", U, "%"]
    : ["", S, ""]
  : ["", "", ""];

// 另一种解法
type CheckPrefix<T> = T extends "+" | "-" ? T : never;
type CheckSuffix<T> = T extends `${infer P}%` ? [P, "%"] : [T, ""];
type PercentageParser<A extends string> = A extends `${CheckPrefix<
  infer L
>}${infer R}`
  ? [L, ...CheckSuffix<R>]
  : ["", ...CheckSuffix<A>];
```

### Drop Char
>从字符串中剔除指定字符。

```typescript
// 模式匹配，把匹配到的指定字符递归剔除
type DropChar<
  S extends string,
  C extends string
> = S extends `${infer L}${C}${infer R}` ? DropChar<`${L}${R}`, C> : S;
```

### MinusOne
>给定一个正整数作为类型的参数，要求返回的类型是该数字减 1。

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
>从类型`T`中选择出属性类型能分配给`U`的，构造成一个新的类型。

```typescript
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};
```

### StartsWith
>实现`StartsWith<T, U>`,接收两个`string`类型参数,然后判断`T`是否以`U`开头,根据结果返回`true`或`false`。

```typescript
type StartsWith<T extends string, U extends string> = T extends `${U}${string}`
  ? true
  : false;
```

### EndsWith
>实现`EndsWith<T, U>`,接收两个`string`类型参数,然后判断`T`是否以`U`结尾,根据结果返回`true`或`false`。

```typescript
type EndsWith<T extends string, U extends string> = T extends `${string}${U}`
  ? true
  : false;
```

### PartialByKeys
>实现一个通用的`PartialByKeys<T, K>`，它接收两个类型参数`T`和`K`。`K`指定应设置为可选的`T`的属性集。当没有提供`K`时，它就和普通的`Partial<T>`一样使所有属性都是可选的。

```typescript
type Copy<T> = {
  [P in keyof T]: T[P]
}

type PartialByKeys<T, K extends keyof T = keyof T> = Copy<Omit<T, K> & {
  [P in K & keyof T]?: T[P]
}>
```

### RequiredByKeys
>实现一个通用的`RequiredByKeys<T, K>`，它接收两个类型参数`T`和`K`。`K`指定应设为必选的`T`的属性集。当没有提供`K`时，它就和普通的`Required<T>`一样使所有的属性成为必选的。

```typescript
type Copy<T> = {
  [K in keyof T]: T[K];
};

// -?表示去掉可选属性修饰符?
type RequiredByKeys<T, K extends keyof T = keyof T> = Copy<
  Omit<T, K> & {
    [P in K]-?: T[P];
  }
>;
```

### Mutable
>实现一个通用的类型`Mutable<T>`，使类型`T`的全部属性可变（非只读）。

```typescript
// -readonly表示去掉只读修饰符readonly
type Mutable<T> = {
  -readonly [K in keyof T]:T[K]
}
```

### OmitByType
>从类型`T`中剔除属性类型能分配给`U`的，构造成一个新的类型。

```typescript
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};
```

### ObjectEntries
>实现一个类型，类似`Object.entries`。

```typescript
// 思路：将对象转为联合类型 -> T[keyof T] / keyof T
type ObjectEntries<T> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T];
```

### Shift
>实现一个类型，类似`Array.shift`。

```typescript
type Shift<T extends unknown[]> = T extends [infer First, ...infer Rest] ? Rest: T
```

### Tuple To Nested Object
>给定一个仅包含字符串类型的元组类型`T`和一个类型`U`，递归构建一个对象。

```typescript
type TupleToNestedObject<T, U> = T extends [infer F, ...infer Rest]
  ? { 
      // 约束F为string类型
      [K in F & string]: TupleToNestedObject<Rest, U>;
    }
  : U;
```

### Reverse
>实现类型版本的数组反转`Array.reverse`。

```typescript
// 当处理数量（个数、长度、层数）不固定的类型的时候，可以只处理一个类型，然后递归的调用自身处理下一个类型，直到结束条件也就是所有的类型都处理完了，就完成了不确定数量的类型编程，达到循环的效果
type Reverse<T extends unknown[]> = T extends [infer F, ...infer Rest]
  ? [...Reverse<Rest>, F]
  : T;
```

### Flip Arguments
>类型`FlipArguments`需要函数类型`T`，并返回一个新的函数类型，该函数类型具有与`T`相同的返回类型，但参数是反向的。

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
>递归地将数组展开，直到达到指定的深度。

```ts
// 思路：把每次遍历到的成员，如果是数组则扁平S层
type FlattenDepth<
  T extends unknown[],
  S extends number = 1,
  U extends unknown[] = []
  // 达到扁平层数，直接返回
> = U["length"] extends S
  ? T
  : T extends [infer F, ...infer R]
  ? F extends unknown[]
    // F是数组类型，把F扔进去扁平
    ? [...FlattenDepth<F, S, [...U, unknown]>, ...FlattenDepth<R, S>] 
    // F不是数组，把扁平的记录传递
    : [F, ...FlattenDepth<R, S, U>]
  : T;

// 另一种思路：每次把整体数组扁平一次（更好理解
// 整体数组扁平一次
type FlattenOnce<T extends unknown[], U extends unknown[] = []> = T extends [
  infer F,
  ...infer R
]
  ? F extends unknown[]
    ? FlattenOnce<R, [...U, ...F]>
    : FlattenOnce<R, [...U, F]>
  : U;

type FlattenDepth<
  T extends unknown[],
  U extends number = 1,
  P extends unknown[] = []
  // 当扁平次数达到指定次数时，直接返回T
> = P["length"] extends U
  ? T
  // 当扁平完成后，直接返回T
  : FlattenOnce<T> extends T
  ? T
  // 否则扁平一次
  : FlattenDepth<FlattenOnce<T>, U, [...P, unknown]>;
```

### BEM style string

>实现一个`CSS BEM`格式命名规则的类型。

```ts
// 思路：数组[number]可以取到该数组所有成员的联合类型，这里只需要额外判断是否是空数组即可
type BEM<
  B extends string,
  E extends string[],
  M extends string[]
> = `${B}${E["length"] extends 0 ? "" : "__"}${E["length"] extends 0
  ? ""
  : E[number]}${M["length"] extends 0 ? "" : "--"}${M["length"] extends 0
  ? ""
  : M[number]}`;

// 另一种解法
type BEM<
  B extends string,
  E extends string[],
  M extends string[]
> = `${B}${E extends [] ? "" : `__${E[number]}`}${M extends []
  ? ""
  : `--${M[number]}`}`;
```

### InorderTraversal

>实现顺序遍历二叉树的类型版本。

```ts
// 中序遍历首先遍历左子树，然后访问根结点，最后遍历右子树。
interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}
// [T] extends [TreeNode]避免触发分布式条件类型
type InorderTraversal<T extends TreeNode | null> = [T] extends [TreeNode]
  ? [...InorderTraversal<T["left"]>, T["val"], ...InorderTraversal<T["right"]>]
  // T为null时返回[]
  : [];
```

### Flip
>实现一个类型，将对象的`key`和`value`交换。

```typescript
// 遍历对象对 key 进行追加变形
type Flip<T extends Record<string, string | number | boolean>> = {
  [P in keyof T as `${T[P]}`]: P;
};
```

### Fibonacci Sequence

>实现类型版本的斐波那契数列。

```ts
// 按照斐波那契数列的规律：1 1 2 3 5 8 13 21...得出 f(n)=f(n-2)+f(n-1)
type Fibonacci<
  T extends number,
  // 当前是第几位
  CurrentIndex extends 1[] = [1],
  // 前一位的结果
  Prev extends 1[] = [],
  // 当前位的结果
  Current extends 1[] = [1]
> = CurrentIndex["length"] extends T
  ? Current["length"]
  // 每次递归一次，当前位数+1
  : Fibonacci<T, [...CurrentIndex, 1], Current, [...Prev, ...Current]>;
```

### AllCombinations

>实现一个类型，返回字符串中子字符的所有组合。

```ts
// 将字符串转成子字符组成的联合类型
type StringToUnion<S> = S extends `${infer F}${infer R}`
  ? F | StringToUnion<R>
  : "";

// 当T只有一位时，Exclude<T, K>会出现never的情况，[T] extends [never] 就是规避这种情况
type AllCombinations<S extends string, T extends string = StringToUnion<S>> = [
  T
] extends [never]
  ? ""
  // 这里需要把每次递归的结果联合起来
  : '' | {
      [K in T]: `${K}${AllCombinations<"", Exclude<T, K>>}`;
    }[T];
```

### Greater Than

>比较两个数字的大小。

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
>在这个挑战中，你需要实现一个类型`Zip`，其中`T`和`U`必须是元组。

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
>判断类型是否是元组类型。

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

>`Chunk<T, N>`接受两个必需的类型参数，`T`必须是元组，`N`必须是>=1的整数。

```ts
/* _____________ Test Cases _____________ */

type test1 = Chunk<[], 1>; // []
type test2 = Chunk<[1, 2, 3], 1>; // [[1], [2], [3]]>>
type test3 = Chunk<[1, 2, 3], 2>; // [[1, 2], [3]]>>
type test4 = Chunk<[1, 2, 3, 4], 2>; // [[1, 2], [3, 4]]>>
type test5 = Chunk<[1, 2, 3, 4], 5>; // [[1, 2, 3, 4]]>>
type test6 = Chunk<[1, true, 2, false], 2>; // [[1, true], [2, false]]>>

/* _____________ Your Code Here _____________ */

type Chunk<
  T extends unknown[],
  N extends number,
  // 用于计数 + 存储
  C extends unknown[] = []
> = T extends [infer F, ...infer R]
  ? C["length"] extends N
    // 到达存储数量时，就把C返回，重新计数
    ? [C, ...Chunk<T, N>]
    : Chunk<R, N, [...C, F]>
  // 数组遍历完时，判断C是否存有成员
  : C extends []
  ? []
  : [C];
```

### Fill

>实现类似`JS`中的数组的`Fill`方法。

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

>实现`Math.trunc`的类型版本，接收字符串或数字取整。

```ts
/* _____________ Test Cases _____________ */
type test1 = Trunc<0.1>; // "0"
type test2 = Trunc<1.234>; // "1"
type test3 = Trunc<".3">; // "0"
type test4 = Trunc<"-10.234">; // "-10"
type test5 = Trunc<10>; // "10"


/* _____________ Your Code Here _____________ */
// 先判断是否匹配以0. | .开头
type Trunc<T extends string | number> = `${T}` extends `${"0." | "."}${string}`
  ? "0"
  // 匹配出整数部分I
  : `${T}` extends `${infer I}.${string}`
    ? I
    : `${T}`;

// 另一种解法：以小数点为划分匹配前后字符
type Trunc<S extends string | number> = `${S}` extends `${infer R}.${infer U}`
  ? R extends ''
    ? '0'
    : R
  : `${S}`
```


### IndexOf
>实现`Array.IndexOf`的类型版本，`indexOf<T, U>`接受数组`T`，任意`U`，并返回数组`T`中第一个`U`的索引。

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
>实现`Array.join`的类型版本，`Join`接受一个数组类型`T`，和一个字符串或数字类型`U`，返回由`U`拼接而成的数组`T`。

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
>实现类型版本的`Array.lastIndexOf`, `LastIndexOf<T, U>`接受数组`T`, `any`类型`U`, 如果`U`存在于`T`中, 返回`U`在数组`T`中最后一个位置的索引, 不存在则返回`-1`。

```ts
// 思路：遍历数组，每次去除最后一个成员比较，定义前面的所有成员为R，匹配到后直接返回R的长度
type LastIndexOf<T extends unknown[], U> = T extends [...infer R, infer L]
  ? Equal<U, L> extends true
    ? R['length']
    : LastIndexOf<R, U>
  : -1
```

### Unique
>`Unique`接收数组类型`T`, 返回去重后的数组类型。

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

>实现`MapTypes<T, R>`，它将对象`T`中的类型转换为类型`R`定义的不同类型。

```ts
/* _____________ Test Cases _____________ */
type test1 = MapTypes<{ stringToArray: string }, { mapFrom: string; mapTo: [] }>; // { stringToArray: [] }
type test2 = MapTypes<{ date: string }, { mapFrom: string; mapTo: Date | null }>; // { date: null | Date }
type test3 = MapTypes<{ name: string; date: Date }, { mapFrom: string; mapTo: boolean } | { mapFrom: Date; mapTo: string }>; // { name: boolean; date: string }

/* _____________ Your Code Here _____________ */

// 思路：遍历T，判断T[K]是否满足mapForm，满足就转成mapTo
type MapTypes<T extends Record<string, any>, R extends Record<'mapFrom' | 'mapTo', any>, U = R> = {
  // 由于R有可能是联合类型，需要判断下
  [K in keyof T]: R extends R ? T[K] extends R['mapFrom'] ? R['mapTo'] : [U] extends [R] ? T[K] : never : never
}

// 另一种解法
type MapTypes<T, R extends { mapFrom: any, mapTo: any }> = {
  [key in keyof T]: [R extends { mapFrom: T[key] } ? R['mapTo'] : never] extends [never]
    ? T[key]
    : R extends { mapFrom: T[key] } ? R['mapTo'] : never
}

// 另一种解法
type MapTypes<T, R extends { mapFrom: any; mapTo: any }> = {
  [K in keyof T]: T[K] extends R['mapFrom']
  // R extends { mapForm：T[K] }判断是不是联合类型
  ? R extends { mapFrom: T[K] }
    ? R['mapTo']
    : never
  : T[K]
}
```

### Construct Tuple
>构造一个给定长度的元组。

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

>给定一个唯一元素的数组，返回所有可能的子序列。

```ts
/* _____________ Test Cases _____________ */
type test1 = Subsequence<[1, 2]>; // [] | [1] | [2] | [1, 2]
type test2 = Subsequence<[1, 2, 3]>; // [] | [1] | [2] | [1, 2] | [3] | [1, 3] | [2, 3] | [1, 2, 3]


/* _____________ Your Code Here _____________ */
// 假设T = [1, 2, 3]
// [1, ...Subsequence<[2, 3]>] | Subsequence<[2, 3]>

// 分解[1, ...Subsequence<[2, 3]>]
// [1, ...[2, ...Subsequence<3>]] | [1, ...Subsequence<3>]
// [1, 2, 3] | [1, 2] | [1, 3] | [1]

// 分解Subsequence<[2, 3]>
// [2, ...Subsequence<3>] | Subsequence<3>
// [2, ...[3]] | [2, ...[]] | [3, ...[]]
// [2, 3] | [2] | [3]

// 最后T遍历完时(即T为空数组），返回[]
type Subsequence<T extends any[]> = T extends [infer F, ...infer R]
  ? [F, ...Subsequence<R>] | Subsequence<R>
  : T;
```



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


### FirstUniqueCharIndex

>给定字符串`S`，查找其中第一个非重复字符并返回其索引。如果不存在，则返回-1。

```ts
// 思路：定义一个数组类型U，既可以存储不满足条件的成员，又可以当成满足条件成员的索引
type FirstUniqueCharIndex<
  T extends string,
  U extends string[] = []
> = T extends `${infer F}${infer R}`
  // 判断F 在不在 U中存在相同的
  ? F extends U[number]
    // 如果在就把F添加进去，此时也相当于索引+1了
    ? FirstUniqueCharIndex<R, [...U, F]>
    // 如果不在，继续判断F在不在R中存在
    : R extends `${string}${F}${string}`
      ? FirstUniqueCharIndex<R, [...U, F]>
      // 双重判断后都不在，就可以返回索引了
      : U['length']
  : -1


// 另一种思路：定义一个字符串类型N（用于判断是否有两个重复子字符），数组类型R（用于索引计数）
type FirstUniqueCharIndex<T extends string, N extends string = T, R extends unknown[] = []> = N extends `${infer F}${infer S}`
  // 判断是否存在两个相同的F
  ? T extends `${string}${F}${string}${F}${string}`
    ? FirstUniqueCharIndex<T, S, [...R, unknown]>
    : R['length']
  : -1
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

>给定一个对象，将其所有键的类型转为原始类型。

```ts
type ToPrimitive<T> = T extends object
  ? { [K in keyof T]: ToPrimitive<T[K]> }
  // 通过valueOf取出它的原始类型
  : T extends { valueOf: () => infer R }
    ? R
    : T
```

### DeepMutable
>深度可修改，与深度只读相反。

```ts
// keyof (...arg: any) => any为never，这里过滤掉函数类型
type DeepMutable<T extends Record<keyof any, any>> = keyof T extends never
  ? T
  : {
      -readonly [K in keyof T]: DeepMutable<T[K]>;
    };
```

### All
>如果列表中的所有元素都等于传入的第二个参数，则返回`true`，如果有任何不匹配则返回`false`。

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

>类似`JS`中的数组的`Filter`方法。

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

### Combination key type

>把多个修饰键两两组合，但不可以出现相同的修饰键组合，提供的`ModifierKeys`中，前面的值比后面的值高，即`cmd ctrl`是可以的，但`ctrl cmd`是不允许的。

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

// 另一种解法：不声明临时类型变量
type Combs<T extends string[]> = T extends [
  infer F extends string,
  ...infer R extends string[]
]
  ? `${F}${R[number]}` | Combs<R>
  : never
```

### Replace First

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
>实现一个类型，`Transpose <[[1, 2], [3, 4]]>; // expected to be [[1, 3], [2, 4]]`，`Transpose <[[1, 2, 3], [4, 5, 6]]>; // expected to be [[1, 4], [2, 5], [3, 6]]`

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

>实现泛型`JSONSchema2TS`，它将返回与给定`JSON`模式对应的`TypeScript`类型。

```ts
type Primitives = {
  string: string;
  number: number;
  boolean: boolean;
};

// 处理基础类型
type HandlePrimitives<T, Type extends keyof Primitives> = T extends {
  enum: unknown[];
}
  ? T["enum"][number]
  : Primitives[Type];

// 处理对象
type HandleObject<T> = T extends {
  properties: infer P;
}
  ? T extends { required: infer R extends unknown[] }
    // 有required字段，就取出required中的key改为必选

    // 这里Omit的作用是
    // { name: string } & { age?: number } extends { name: string; age?: number } -> false
    // Omit<{ name: string } & { age?: number }, never> extends { name: string; age?: number } -> true
    ? Omit<
        {
          [K in R[number] & keyof P]: JSONSchema2TS<P[K]>;
        } & {
          [K in keyof P]?: JSONSchema2TS<P[K]>;
        },
        never
      >
    : {
        [K in keyof P]?: JSONSchema2TS<P[K]>;
      }
  : Record<string, unknown>;

// 处理数组
type HandleArray<T> = T extends { items: infer I }
  ? JSONSchema2TS<I>[]
  : unknown[];

type JSONSchema2TS<T> = T extends { type: infer Type }
  ? Type extends keyof Primitives
    ? HandlePrimitives<T, Type>
    : Type extends "object"
    ? HandleObject<T>
    : HandleArray<T>
  : never;
```

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

>给定一个数字N，求0 + 1 + ... + N。

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

>

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

### Public Type

>从给定类型`T`中移除以开头的键。

```ts
/* _____________ Test Cases _____________ */
type test1 = PublicType<{ a: number }>; // { a: number }
type test2 = PublicType<{ _b: string | bigint }>; // {}
type test3 = PublicType<{ readonly c?: number }>; // { readonly c?: number }
type test4 = PublicType<{ d: string; _e: string }>; // { d: string }
type test5 = PublicType<{ _f: () => bigint[] }>; // {}
type test6 = PublicType<{ g: "_g" }>; // { g: "_g" }
type test7 = PublicType<{ __h: number; i: unknown }>; // { i: unknown }

/* _____________ Your Code Here _____________ */
type PublicType<T extends object> = {
  // 匹配以_开头的模板字符
  [K in keyof T as K extends `_${any}` ? never : K]: T[K]
}
```

## hard

### Simple Vue

>实现类似Vue的类型支持的简化版本。

```ts
/* _____________ Test Cases _____________ */
import type { Debug, Equal, Expect, IsAny } from "@type-challenges/utils";

SimpleVue({
  data() {
    // @ts-expect-error
    this.firstname;
    // @ts-expect-error
    this.getRandom();
    // @ts-expect-error
    this.data();

    return {
      firstname: "Type",
      lastname: "Challenges",
      amount: 10,
    };
  },
  computed: {
    fullname() {
      return `${this.firstname} ${this.lastname}`;
    },
  },
  methods: {
    getRandom() {
      return Math.random();
    },
    hi() {
      alert(this.amount);
      alert(this.fullname.toLowerCase());
      alert(this.getRandom());
    },
    test() {
      const fullname = this.fullname;
      const cases: [Expect<Equal<typeof fullname, string>>] = [] as any;
    },
  },
});


/* _____________ Your Code Here _____________ */
// D：data C: computed M: methods
declare function SimpleVue<D, C, M>(options: Options<D, C, M>): any;

// 获取计算属性的返回值类型
type GetComputedValueType<C> = {
  [P in keyof C]: C[P] extends () => infer R ? R : never;
};

type Options<D, C, M> = {
  data: (this: void) => D;
  // ThisType: 用于指定 this 的类型，不影响参数的类型
  // 这里C & ThisType<D>的意思是，C中的this类型为D
  computed: C & ThisType<D>;

  // methods中的this要访问到data和computed中的属性以及其他methods
  methods: M & ThisType<D & GetComputedValueType<C> & M>;
};
```

### Currying 1

>柯里化 是一种将带有多个参数的函数转换为每个带有一个参数的函数序列的技术。

```ts
// 思路：遍历函数参数T，每次创建一个函数并返回一个函数
type Curry<T, R> = T extends [infer F, ...infer Rest]
  ? (k: F) => Curry<Rest, R>
  : R;

declare function Currying<Fn>(
  fn: Fn
): Fn extends (...args: infer Rest) => infer R
  ? Rest extends []
    ? Fn
    : Curry<Rest, R>
  : never;

// 另一种解法
type Curry<Fn> = Fn extends (...args: infer Args) => infer R
  ? Args extends [infer F, ...infer Rest]
    ? (k: F) => Curry<(...args: Rest) => R>
    : R
  : never;

declare function Currying<Fn>(fn: Fn): Curry<Fn>;
```

### Union to Intersection

>把联合类型转成交叉类型。

```ts
// 利用了函数的参数具有逆变的特点
// 同一类型变量在逆变位置上的多个候选变量会导致推断出交集类型
type UnionToIntersection<U> = (U extends U ? (a: U) => any : U) extends (a: infer R) => any
  ? R
  : never;

// 利用逆变的另一个例子
type Bar<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void }
  ? U
  : never;
type T = Bar<{ a: (x: string) => void; b: (x: number) => void }>; // string & number

// 协变的一个例子:
// 同一类型变量在协变位置上的多个候选变量会导致推断出联合类型
type Foo<T> = T extends { a: infer U; b: infer U } ? U : never;
type T2 = Foo<{ a: string; b: number }>; // string | number
```

### Get Required

>实现高级工具类型`GetRequired<T>`，该类型保留所有必需的属性

```ts
/* _____________ Test Cases _____________ */
type test = GetRequired<{ foo: number; bar?: string }>; // { foo: number }>>,
type test2 = GetRequired<{ foo: undefined; bar?: undefined }>; // { foo: undefined }>

/* _____________ Your Code Here _____________ */
// 思路：把T用Required包装后取对应的K，判读属性是否是必需
type GetRequired<T extends object> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};

// 另一种写法：通过-?判断
type GetRequired<T extends object> = {
  // 如果K是可选，-?后就是必需
  [K in keyof T as { [P in K]: T[P] } extends { [P in K]-?: T[P] }
    ? K
    : never]: T[K];
};
```


### Get Optional

>实现高级工具类型`GetOptional<T>`，该类型保留所有可选属性


```ts
/* _____________ Test Cases _____________ */
type test1 = GetOptional<{ foo: number; bar?: string }>; // { bar?: string }
type test2 = GetOptional<{ foo: undefined; bar?: undefined }>; // { bar?: undefined }

/* _____________ Your Code Here _____________ */
// 思路：把T用Required包装后取对应的K，判读属性是否是必需
type GetOptional<T extends object> = {
  [K in keyof T as T[K] extends Required<T>[K] ? never : K]: T[K];
};

// 另一种写法：通过-?判断
type GetRequired<T extends object> = {
  // 如果K是可选，-?后就是必需
  [K in keyof T as { [P in K]: T[P] } extends { [P in K]-?: T[P] }
    ? never
    : K]: T[K];
};
```

### Required Keys

>实现高级工具类型`RequiredKeys<T>`，该类型返回`T`中所有必需属性的键组成的一个联合类型。

```ts
type RequiredKeys<T extends object> = keyof {
  // 取出所有必需属性的建
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};
```

### Optional Keys

>实现高级工具类型`OptionalKeys<T>`，该类型将`T`中所有可选属性的键合并为一个联合类型。

```ts
type OptionalKeys<T extends object> = keyof {
  // 取出所有可选属性的建
  [K in keyof T as T[K] extends Required<T>[K] ? never : K]: T[K];
};
```

### Capitalize Words

>实现`CapitalizeWords<T>`，它将字符串的每个单词的第一个字母转换为大写，其余部分保持原样。

```ts
// 通过Uppercase<S> extends Lowercase<S>判断是否是字母
type CapitalizeWords<
  S extends string,
  W extends string = ""
> = S extends `${infer F}${infer R}`
  ? CapitalizeWords<
      // 如果F非字母，则把R的首字符转为大写（这里就算R的首字符不是字母也不影响）
      Uppercase<F> extends Lowercase<F> ? Capitalize<R> : R,
      // 拼接到W上
      `${W}${F}`
    >

  // 遍历完后把W的首字符转为大写（在找到第一个非字母时，都是小写，因此需要转一次）
  : Capitalize<W>;


// 另一种解法，对长字符串不适应（递归层级过深），仅扩展思路
type CapitalizeRest<S extends string> = S extends `${infer F}${infer R}`
  ? `${F}${CapitalizeRest<
      Uppercase<F> extends Lowercase<F> ? Capitalize<R> : R
    >}`
  : S;

type CapitalizeWords<S extends string> = Capitalize<CapitalizeRest<S>>;
```

### CamelCase

>实现`CamelCase<T>`，将`snake_case`类型的表示的字符串转换为`camelCase`的表示方式。

```ts
/* _____________ Test Cases _____________ */
type test1 = CamelCase<"foobar">; // 'foobar'
type test2 = CamelCase<"FOOBAR">; // 'foobar'
type test3 = CamelCase<"foo_bar">; // 'fooBar'
type test4 = CamelCase<"foo__bar">; // 'foo_Bar'
type test5 = CamelCase<"foo_$bar">; // 'foo_$bar'
type test6 = CamelCase<"foo_bar_">; // 'fooBar_'
type test7 = CamelCase<"foo_bar__">; // 'fooBar__'
type test8 = CamelCase<"foo_bar_$">; // 'fooBar_$'
type test9 = CamelCase<"foo_bar_hello_world">; // 'fooBarHelloWorld'>>,
type test10 = CamelCase<"HELLO_WORLD_WITH_TYPES">; // 'helloWorldWithTypes'>>,
type test11 = CamelCase<"-">; // '-'
type test12 = CamelCase<"">; // ''
type test13 = CamelCase<"😎">; // '😎'


/* _____________ Your Code Here _____________ */
// 思路：以_做分割匹配三个部分，_前面的所有字符L，_后面的第一个字符F，F后面的所有字符R
type CamelCase<S extends string> = S extends `${infer L}_${infer F}${infer R}`  
  ? Uppercase<F> extends Lowercase<F>
    // 如果F是非字母，保留_，把F+R继续递归
    ? `${Lowercase<L>}_${CamelCase<`${F}${R}`>}`
    // F是字母就转成大写，去掉_，然后继续递归R
    : `${Lowercase<L>}${Capitalize<F>}${CamelCase<R>}`
  : Lowercase<S>;
```


### C-printf Parser

>这个挑战要求您解析输入字符串并提取格式占位符，如`%d`和`%f`。例如，如果输入字符串是`" the result is %d."`，那么解析的结果是一个元组`['dec']`。

```ts
/* _____________ Test Cases _____________ */
type test1 = ParsePrintFormat<"">; // []>>
type test2 = ParsePrintFormat<"Any string.">; // []>>
type test3 = ParsePrintFormat<"The result is %d.">; // ['dec']>>
type test4 = ParsePrintFormat<"The result is %%d.">; // []>>
type test5 = ParsePrintFormat<"The result is %%%d.">; // ['dec']>>
type test6 = ParsePrintFormat<"The result is %f.">; // ['float']>>
type test7 = ParsePrintFormat<"The result is %h.">; // ['hex']>>
type test8 = ParsePrintFormat<"The result is %q.">; // []>>
type test9 = ParsePrintFormat<"Hello %s: score is %d.">; // ['string', 'dec']>>
type test10 = ParsePrintFormat<"The result is %">; // []>>


/* _____________ Your Code Here _____________ */
type ControlsMap = {
  c: "char";
  s: "string";
  d: "dec";
  o: "oct";
  h: "hex";
  f: "float";
  p: "pointer";
};

// 匹配%后面的第一个字符在不在ControlsMap的key中
type ParsePrintFormat<S extends string> =
  // 每次把%前面的字符舍弃
  S extends `${infer L}%${infer F}${infer R}`
    ? F extends keyof ControlsMap
      // 如果在，就把读取的value添加进数组，然后继续递归
      ? [ControlsMap[F], ...ParsePrintFormat<R>]
      : ParsePrintFormat<R>
    : [];
```

### Vue Basic Props

>完善`Simple Vue`，追加`Props`类型。

```ts
/* _____________ Test Cases _____________ */
import type { Debug, Equal, Expect, IsAny } from "@type-challenges/utils";

class ClassA {}

VueBasicProps({
  props: {
    propA: {},
    propB: { type: String },
    propC: { type: Boolean },
    propD: { type: ClassA },
    propE: { type: [String, Number] },
    propF: RegExp,
  },
  data(this) {
    type PropsType = Debug<typeof this>;
    type cases = [
      Expect<IsAny<PropsType["propA"]>>,
      Expect<Equal<PropsType["propB"], string>>,
      Expect<Equal<PropsType["propC"], boolean>>,
      Expect<Equal<PropsType["propD"], ClassA>>,
      Expect<Equal<PropsType["propE"], string | number>>,
      Expect<Equal<PropsType["propF"], RegExp>>
    ];

    // @ts-expect-error
    this.firstname;
    // @ts-expect-error
    this.getRandom();
    // @ts-expect-error
    this.data();

    return {
      firstname: "Type",
      lastname: "Challenges",
      amount: 10,
    };
  },
  computed: {
    fullname() {
      return `${this.firstname} ${this.lastname}`;
    },
  },
  methods: {
    getRandom() {
      return Math.random();
    },
    hi() {
      alert(this.fullname.toLowerCase());
      alert(this.getRandom());
    },
    test() {
      const fullname = this.fullname;
      const propE = this.propE;
      type cases = [
        Expect<Equal<typeof fullname, string>>,
        Expect<Equal<typeof propE, string | number>>
      ];
    },
  },
});


/* _____________ Your Code Here _____________ */
// 获取计算属性的返回值类型
type GetComputedValueType<T> = {
  [K in keyof T]: T[K] extends () => infer R ? R : T[K];
};

type GetPropType<T> = T extends unknown[]
  // props传入的元组类型，取出成员的联合类型
  ? GetPropType<T[number]>
  // props传入的是函数，取出返回值的类型
  : T extends (...args: any) => any
  ? ReturnType<T>
  // props传入的是构造函数，取出实例的类型
  : T extends new (...args: any) => any
  ? InstanceType<T>
  : T;

// 处理props类型
type Props<T> = {
  [K in keyof T]: T[K] extends Record<string, never>
    ? any
    : T[K] extends { type: infer R }
    ? GetPropType<R>
    : GetPropType<T[K]>;
};

interface Options<P, D, C, M> {
  props: P;
  data: (this: Props<P>) => D;
  computed: C & ThisType<D & GetComputedValueType<C> & M & Props<P>>;
  methods: M & ThisType<D & GetComputedValueType<C> & M & Props<P>>;
}

// P: props D：data C: computed M: methods
declare function VueBasicProps<P, D, C, M>(options: Options<P, D, C, M>): any;
```

### IsAny

>实现`IsAny<T>`，它接受输入类型`T`。如果`T`是`any`，则返回`true`，否则返回`false`。

```ts
// any 类型与任何类型的交叉都是 any，也就是 1 & any 结果是 any
type IsAny<T> = 0 extends 1 & T ? true : false;

// 需要注意上面这个条件类型的左边和右边在去除T后不能成立
// 如果成立的话
type IsAny<T> = 0 extends 0 & T ? true : false

// 0 extends 0 & unknown -> 0 extends 0
type test = IsAny<unknown> // true
```

### Get

>`lodash`中的`get`函数用于访问`JavaScript`中嵌套值，实现一个类型版本。

```ts
/* _____________ Test Cases _____________ */
type Data = {
  foo: {
    bar: {
      value: "foobar";
      count: 6;
    };
    included: true;
  };
  "foo.baz": false;
  hello: "world";
};

type test1 = Get<Data, "hello">; // 'world'
type test2 = Get<Data, "foo.bar.count">; // 6
type test3 = Get<Data, "foo.bar">; // { value: 'foobar'; count: 6 }
type test4 = Get<Data, "foo.baz">; // false
type test5 = Get<Data, "no.existed">; // never


/* _____________ Your Code Here _____________ */
// 递归出口 K extends keyof T -> T[K]
type Get<T, K> = K extends keyof T
  ? T[K]
  // 匹配出.号前面的key，和.号后面的所有字符
  : K extends `${infer L}.${infer R}`
  // L在T的key中
  ? L extends keyof T
    // 继续递归
    ? Get<T[L], R>
    : never
  : never;


// 另一种思路：直接先匹配.号前后字符
type Get<T, K> = K extends `${infer A}.${infer B}`
  // 前面的A在T的key中
  ? A extends keyof T
    // 递归
    ? Get<T[A], B>
    : never
  // K匹配不上`${infer A}.${infer B}`时，再判断K是否在T的key中
  : K extends keyof T
    ? T[K]
    : never;
```


### String to Number

>将字符串文字转换为数字，其行为类似于`number.parseint`。

```ts
/* _____________ Test Cases _____________ */
type test1 = ToNumber<"0">; // 0
type test2 = ToNumber<"5">; // 5
type test3 = ToNumber<"12">; // 12
type test4 = ToNumber<"27">; // 27
type test5 = ToNumber<"18@7_$%">; // never

/* _____________ Your Code Here _____________ */
// 思路：通过构建长度相等的数组，不适应大数值和非纯数值
type ToNumber<S extends string, N extends 1[] = []> = S extends `${N["length"]}`
  ? N["length"]
  : ToNumber<S, [...N, 1]>;

// 另一种思路：infer 的时候加上 extends 来约束推导的类型为number类型
type ToNumber<S extends string> = S extends `${infer N extends number}`
  ? N
  : never;
```

### Tuple Filter

>实现类型`FilterOut<T, F>`，从元组`T`中过滤出给定类型`F`的项。

```ts
/* _____________ Test Cases _____________ */
type test1 = FilterOut<[], never>; // []
type test2 = FilterOut<[never], never>; // []
type test3 = FilterOut<["a", never], never>; // ['a']
type test4 = FilterOut<[1, never, "a"], never>; // [1, 'a']
type test5 = FilterOut<
  [never, 1, "a", undefined, false, null],
  never | null | undefined
>; // [1, 'a', false]
type test6 = FilterOut<
  [number | null | undefined, never],
  never | null | undefined
>; // [number | null | undefined]


/* _____________ Your Code Here _____________ */
type FilterOut<T extends any[], F> = T extends [infer L, ...infer R]
  // 因为L有可能是联合类型，避免触发分布式条件类型
  ? [L] extends [F]
    // 如果L满足F，就过滤掉
    ? FilterOut<R, F>
    : [L, ...FilterOut<R, F>]
  : [];
```

### Tuple to Enum Object

>实现一个类型把元组转成类似枚举的对象。

```ts
/* _____________ Test Cases _____________ */
const OperatingSystem = ["macOS", "Windows", "Linux"] as const;
type test1 = Enum<[]>; // {}
type test2 = Enum<typeof OperatingSystem>;
//  {
//   readonly MacOS: 'macOS'
//   readonly Windows: 'Windows'
//   readonly Linux: 'Linux'
// }

type test3 = Enum<typeof OperatingSystem, true>;
// {
//   readonly MacOS: 0
//   readonly Windows: 1
//   readonly Linux: 2
// }


/* _____________ Your Code Here _____________ */
// 获取元组的索引组成联合类型
type TupleKeys<T extends readonly unknown[]> = T extends readonly [
  infer _,
  ...infer Tail
]
  ? TupleKeys<Tail> | Tail["length"]
  : never;

type Enum<T extends readonly string[], N extends boolean = false> = {
  // 这里K就是对应的索引，0, 1, 2...，把K重映射为值
  readonly [K in TupleKeys<T> as Capitalize<T[K]>]: N extends true ? K : T[K];
};

// 另一种解法
type Enum<T extends readonly string[], N extends boolean = false> = {
  // K extends `${number}`约束K为数值的字符串类型，这里相当于取索引
  readonly [K in keyof T as K extends `${number}` ? Capitalize<T[K]>: never]: N extends false
    ? T[K]
    // 这里的K是字符串字面量类型，要转成数字字面量类型
    : K extends `${infer I extends number}` 
       ? I
       : never
};
```

### printf 

```ts
/* _____________ Test Cases _____________ */
type test1 = Format<"abc">; // string
type test2 = Format<"a%sbc">; // (s1: string) => string
type test3 = Format<"a%dbc">; // (d1: number) => string
type test4 = Format<"a%%dbc">; // string
type test5 = Format<"a%%%dbc">; // (d1: number) => string
type test6 = Format<"a%dbc%s">; // (d1: number) => (s1: string) => string

/* _____________ Your Code Here _____________ */
// 以%号分割匹配
type Format<T extends string> = T extends `${infer _}%${infer F}${infer R}`
  // 匹配到的第一个字符F为类型
  //  %s -> (s: string), %d -> (d: number)
  ? F extends "s"
    // 剩余字符R继续递归匹配
    ? (s: string) => Format<R>
    : F extends "d"
    ? (d: number) => Format<R>
    : Format<R>
  : string;

// 另一种解法：思路一样
type MapDict = {
  s: string;
  d: number;
};

type Format<T extends string> = T extends `${string}%${infer M}${infer R}`
  ? M extends keyof MapDict
    ? (x: MapDict[M]) => Format<R>
    : Format<R>
  : string;
```

### Deep object to unique

>创建一个类型，该类型接受一个对象，并使该对象和其中的所有深度嵌套对象唯一，同时保留所有对象的字符串和数字键，以及这些键上的所有属性的值。

```ts
todo
```

### Length of String 2

>实现一个计算模板字符串长度的类型`LengthOfString<S>`。

```ts
/* _____________ Test Cases _____________ */
type test1 = LengthOfString<"">; // 0
type test2 = LengthOfString<"1">; // 1
type test3 = LengthOfString<"12">; // 2
type test4 = LengthOfString<"1234567890">; // 10
type test5 = LengthOfString<"12345678901">; // 11
type test6 = LengthOfString<"123456789012">; // 12
type test7 = LengthOfString<"12345678901234567890">; // 20
type test8 = LengthOfString<"123456789012345678901">; // 21
type test9 = LengthOfString<"1234567890123456789012">; // 22
type test10 =
  LengthOfString<"aaaaaaaaaaaaggggggggggggggggggggkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">; // 272
type test11 =
  LengthOfString<"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000">; // 999


/* _____________ Your Code Here _____________ */
// 思路：遍历S，每遍历1个子字符，就给L+1，最后返回L的长度
type LengthOfString<
  S extends string,
  L extends 1[] = []
> = S extends `${infer F}${infer R}`
  ? LengthOfString<R, [...L, 1]>
  : L["length"];


// 另一种解法：
// 适用于超长字符串的长度计算
type LengthOfString<
  S extends string,
  L extends 1[] = []
  // 一次匹配10个字符
> = S extends `${s}${s}${s}${s}${s}${s}${s}${s}${s}${s}${infer R}`
  ? LengthOfString<R, [...L, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]>
  // 匹配不上再去匹配1个字符
  : S extends `${s}${infer R}`
  ? LengthOfString<R, [...L, 1]>
  : L["length"];
```

### Union to Tuple

>实现一个类型`UnionToTuple`用于将联合转换为元组。

```ts
/* _____________ Test Cases _____________ */
type ExtractValuesOfTuple<T extends any[]> = T[keyof T & number];

type test1 = UnionToTuple<"a" | "b">["length"]; // 2
type test2 = ExtractValuesOfTuple<UnionToTuple<"a" | "b">>; // 'a' | 'b'
type test3 = ExtractValuesOfTuple<UnionToTuple<"a">>; // 'a'
type test4 = ExtractValuesOfTuple<UnionToTuple<any>>; // any
type test5 = ExtractValuesOfTuple<UnionToTuple<undefined | void | 1>>; // void | 1
type test6 = ExtractValuesOfTuple<UnionToTuple<any | 1>>; // any | 1
type test7 = ExtractValuesOfTuple<UnionToTuple<any | 1>>; // any
type test8 = ExtractValuesOfTuple<UnionToTuple<"d" | "f" | 1 | never>>; // 'f' | 'd' | 1
type test9 = ExtractValuesOfTuple<UnionToTuple<[{ a: 1 }] | 1>>; // [{ a: 1 }] | 1
type test10 = ExtractValuesOfTuple<UnionToTuple<never>>; // never
type test11 = ExtractValuesOfTuple<
  UnionToTuple<"a" | "b" | "c" | 1 | 2 | "d" | "e" | "f" | "g">
>; // 'f' | 'e' | 1 | 2 | 'g' | 'c' | 'd' | 'a' | 'b'


/* _____________ Your Code Here _____________ */
// 联合类型转交叉类型 (x: 1) => 0 | (x: 2) => 0 -> (x: 1) => 0 & (x: 2) => 0
type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => 0 : never
) extends (arg: infer I) => 0
  ? I
  : never;

// 函数重载进行类型推断时，将从最后一个签名推断
// (x: 1) => 0 & (x: 2) => 0 extends (x: infer L) => 0 ? L : never
// L为2
type LastInUnion<U> = UnionToIntersection<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer L) => 0
  ? L
  : never;

type UnionToTuple<U, Last = LastInUnion<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last];
```

### String Join

>创建类型安全的字符串连接实用程序。

```ts
/* _____________ Test Cases _____________ */
// Edge cases
const noCharsOutput = join("-")();
const oneCharOutput = join("-")("a");
const noDelimiterOutput = join("")("a", "b", "c");

// Regular cases
const hyphenOutput = join("-")("a", "b", "c");
const hashOutput = join("#")("a", "b", "c");
const twoCharOutput = join("-")("a", "b");
const longOutput = join("-")("a", "b", "c", "d", "e", "f", "g", "h");

type test1 = typeof noCharsOutput; // ""
type test2 = typeof oneCharOutput; // "a"
type test3 = typeof noDelimiterOutput; // "abc"
type test4 = typeof twoCharOutput; // "a-b"
type test5 = typeof hyphenOutput; // "a-b-c"
type test6 = typeof hashOutput; // "a#b#c"
type test7 = typeof longOutput; // "a-b-c-d-e-f-g-h"


/* _____________ Your Code Here _____________ */
type Join<
  D extends string,
  R extends string[],
  O extends string = ""
> = R extends [infer F extends string, ...infer Res extends string[]]
  ? // 遍历字符串，依次拼接
    // 如果是第一个字符串，直接拼接，否则加上分隔符
    Join<D, Res, `${O}${O extends "" ? "" : D}${F}`>
  : O;

declare function join<D extends string>(
  delimiter: D
): <R extends string[]>(...parts: R) => Join<D, R>;
```

### DeepPick 

>实现一个类型`DeepPick`，它扩展了`Utility`类型`Pick`。类型接受两个参数。


```ts
/* _____________ Test Cases _____________ */
type Obj = {
  a: number;
  b: string;
  c: boolean;
  obj: {
    d: number;
    e: string;
    f: boolean;
    obj2: {
      g: number;
      h: string;
      i: boolean;
    };
  };
  obj3: {
    j: number;
    k: string;
    l: boolean;
  };
};

type test1 = DeepPick<Obj, "">; // unknown
type test2 = DeepPick<Obj, "a">; // { a: number }
type test3 = DeepPick<Obj, "a" | "">; // { a: number } & unknown
type test4 = DeepPick<Obj, "a" | "obj.e">; // { a: number } & { obj: { e: string } }
type test5 = DeepPick<Obj, "a" | "obj.e" | "obj.obj2.i">; // { a: number } & { obj: { e: string } } & { obj: { obj2: { i: boolean } } }


/* _____________ Your Code Here _____________ */
// 如果路径满足x.x
type TypeGet<T, Paths> = Paths extends `${infer A}.${infer B}`
  // 取出第一个路径，把第二个路径递归传入
  ? A extends keyof T
    ? { [K in A]: TypeGet<T[A], B> }
    : never
  // 路径不满足x.x，判断是否满足keyof T
  : Paths extends keyof T
  ? { [K in Paths]: T[Paths] }
  : never;

// 利用函数参数的逆变特征，把联合类型转换为交叉类型
type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends (
  arg: infer I
) => any
  ? I
  : never;

type DeepPick<T, PathUnion extends string> = UnionToIntersection<
  // 由于PathUnion可能是联合类型，TypeGet得到的类型结果是联合类型
  // 需要通过UnionToIntersection转为交叉类型
  TypeGet<T, PathUnion>
>;

// 另一种解法
type DeepPick<
  T extends { [x: PropertyKey]: any },
  U extends string
> = UnionToIntersection<
  U extends keyof T
    ? Pick<T, U>
    : U extends `${infer L}.${infer R}`
    ? { [P in L]: DeepPick<T[L], R> }
    : never // UnionToIntersection<never> ==> unknown
>;
```

### Pinia

>创建一个类型级函数，其类型与`Pinia`库相似。

```ts
/* _____________ Test Cases _____________ */
const store = defineStore({
  id: "",
  state: () => ({
    num: 0,
    str: "",
  }),
  getters: {
    stringifiedNum() {
      // @ts-expect-error
      this.num += 1;

      return this.num.toString();
    },
    parsedNum() {
      return parseInt(this.stringifiedNum);
    },
  },
  actions: {
    init() {
      this.reset();
      this.increment();
    },
    increment(step = 1) {
      this.num += step;
    },
    reset() {
      this.num = 0;

      // @ts-expect-error
      this.parsedNum = 0;

      return true;
    },
    setNum(value: number) {
      this.num = value;
    },
  },
});

// @ts-expect-error
store.nopeStateProp;
// @ts-expect-error
store.nopeGetter;
// @ts-expect-error
store.stringifiedNum();
store.init();
// @ts-expect-error
store.init(0);
store.increment();
store.increment(2);
// @ts-expect-error
store.setNum();
// @ts-expect-error
store.setNum("3");
store.setNum(3);

const r = store.reset();

type test1 = typeof store.num; // number
type test2 = typeof store.str; // string
type test3 = typeof store.stringifiedNum; // string
type test4 = typeof store.parsedNum; // number
type test5 = typeof r; // true


/* _____________ Your Code Here _____________ */
// 获取getter返回值的类型
type GettersReturnType<G> = {
  readonly [K in keyof G]: G[K] extends (...args: never[]) => infer R
    ? R
    : never;
};

interface Store<S, G, A> {
  id: string;
  state: () => S;
  // ThisType: 用于指定 this 的类型，不影响参数的类型
  // getters的类型为G， getters的this类型为Readonly<S> & GettersReturnType<G> & A
  // 注意getters中访问state是只读的
  getters?: G & ThisType<Readonly<S> & GettersReturnType<G> & A>;
  actions?: A & ThisType<S & GettersReturnType<G> & A>;
}

declare function defineStore<S, G, A>(
  store: Store<S, G, A>
): Readonly<S> & GettersReturnType<G> & A;
```

### Camelize 

>实现`Camelize`类型: 将对象属性名从 蛇形命名(下划线命名) 转换为 小驼峰命名。

```ts
/* _____________ Test Cases _____________ */
type test1 = Camelize<{
  some_prop: string;
  prop: { another_prop: string };
  array: [
    { snake_case: string },
    { another_element: { yet_another_prop: string } },
    { yet_another_element: string }
  ];
}>;
// {
//   someProp: string;
//   prop: { anotherProp: string };
//   array: [
//     { snakeCase: string },
//     { anotherElement: { yetAnotherProp: string } },
//     { yetAnotherElement: string }
//   ];
// }


/* _____________ Your Code Here _____________ */
// 驼峰命名 some_prop -> someProp
// 以_做分隔符，取出前后的字符，把后面的字符首字符转为大写后继续递归
type CamelizeKey<T extends string> = T extends `${infer L}_${infer R}`
  ? `${L}${CamelizeKey<Capitalize<R>>}`
  : T;

type Camelize<T> = T extends unknown[]
  ? // 如果T是数组，通过[K in keyof T]出来的结构体也是数组
    {
      [K in keyof T]: Camelize<T[K]>;
    }
  : T extends object
  // 如果T是对象，则把K转一层
  ? {
      [K in keyof T as CamelizeKey<K & string>]: Camelize<T[K]>;
    }
  : T;
```

### Drop String

>从字符串中删除指定的字符。

```ts
/* _____________ Test Cases _____________ */
type test = DropString<'foobar!', 'fb'> // 'ooar!'

/* _____________ Your Code Here _____________ */
type StrToArr<
  S extends string,
  U extends string[] = []
> = S extends `${infer F}${infer R}` ? StrToArr<R, [...U, F]> : U;

type DropString<
  S extends string,
  R extends string,
  // 把R转成元组（存储R中的每一个子字符
  U extends string[] = StrToArr<R>
> = S extends `${infer F}${infer Rest}`
  // 遍历S，每次取出第一个子字符串F，判断是否存在元组中
  ? F extends U[number]
    // 存在则舍弃
    ? DropString<Rest, R, U>
    // 否则拼接
    : `${F}${DropString<Rest, R, U>}`
  : S;


// 另一种解法
type DropString<
  S extends string,
  R extends string
> = S extends `${infer F}${infer Rest}`
  // 反向匹配，用R去匹配F
  ? R extends `${any}${F}${any}`
    // 匹配上了，则舍弃F
    ? DropString<Rest, R>
    // 否则拼接
    : `${F}${DropString<Rest, R>}`
  : S;
```


### Split

>`split()`方法通过查找分隔符将字符串拆分为子字符串数组，并返回新数组，实现类型版本的`split`。

```ts
/* _____________ Test Cases _____________ */
type test1 = Split<"Hi! How are you?", "z">; // ['Hi! How are you?']
type test2 = Split<"Hi! How are you?", " ">; // ['Hi!', 'How', 'are', 'you?']
type test3 = Split<"Hi! How are you?", "">; // ['H', 'i', '!', ' ', 'H', 'o', 'w', ' ', 'a', 'r', 'e', ' ', 'y', 'o', 'u', '?']
type test4 = Split<"", "">; // []
type test5 = Split<"", "z">; // ['']
type test6 = Split<string, "whatever">; // string[]

/* _____________ Your Code Here _____________ */
type Split<S extends string, SEP extends string> = string extends S
  // 对直接传入string做处理
  ? string[]
  // 以分隔符匹配，匹配分隔符前面和后面的所有字符
  : S extends `${infer L}${SEP}${infer R}`
  // 把前面的添加进数组，继续递归后面的
  ? [L, ...Split<R, SEP>]
  // 判断分隔符是否非空
  : SEP extends ""
  ? []
  : [S];
```

### ClassPublicKeys

>实现泛型的`ClassPublicKeys<T>`，它返回类的所有`pulic key`。

```ts
/* _____________ Test Cases _____________ */
class A {
  public str: string;
  protected num: number;
  private bool: boolean;
  constructor() {
    this.str = "naive";
    this.num = 19260917;
    this.bool = true;
  }

  getNum() {
    return Math.random();
  }
}

type test = ClassPublicKeys<A>; //  'str' | 'getNum'


/* _____________ Your Code Here _____________ */
type ClassPublicKeys<T> = keyof T
```

### IsRequiredKey 

>实现一个泛型`IsRequiredKey<T, K>`，返回`K`是否是`T`的必需键。

```ts
/* _____________ Test Cases _____________ */
type test1 = IsRequiredKey<{ a: number; b?: string }, "a">; // true
type test2 = IsRequiredKey<{ a: number; b?: string }, "b">; // false
type test3 = IsRequiredKey<{ a: number; b?: string }, "b" | "a">; // false


/* _____________ Your Code Here _____________ */
// 因为K有可能是联合类型，因此包裹下，避免触发分布式条件类型
type IsRequiredKey<T, K extends keyof T> = [K] extends [
  // 取出所有键（必需的）的联合
  keyof {
    // 保留T中必需的键
    [P in keyof T as T[P] extends Required<T>[K] ? P : never]: P;
  }
]
  ? true
  : false;

// 另一种解法
type IsRequiredKey<
  Type,
  Keys extends keyof Type
> = Pick<Type, Keys> extends Required<Pick<Type, Keys>>
  ? true
  : false
```

### ObjectFromEntries

>实现类型版本的`Object.fromEntries`。

```ts
/* _____________ Test Cases _____________ */
interface Model {
  name: string;
  age: number;
  locations: string[] | null;
}

type ModelEntries =
  | ["name", string]
  | ["age", number]
  | ["locations", string[] | null];

type test1 = ObjectFromEntries<ModelEntries>; // Model

/* _____________ Your Code Here _____________ */
// T为元组的联合类型
type ObjectFromEntries<T extends [string, any]> = {
  // P遍历联合类型就是每一项元组，直接取0和1索引即可
  [P in T as P[0]]: P[1];
};
```

### IsPalindrome

>实现`type IsPalindrome<T>`检查字符串或数字是否为回文。

```ts
/* _____________ Test Cases _____________ */
type test1 = IsPalindrome<"abc">; // false
type test2 = IsPalindrome<"b">; // true
type test3 = IsPalindrome<"abca">; // false
type test4 = IsPalindrome<"abba">; // true
type test5 = IsPalindrome<"abcba">; // true
type test6 = IsPalindrome<121>; // true
type test7 = IsPalindrome<2332>; // true
type test8 = IsPalindrome<19260817>; // false


/* _____________ Your Code Here _____________ */
type ToArr<S> = `${S}` extends `${infer L}${infer R}` ? [L, ...ToArr<R>] : [];

type IsPalindrome<
  T extends string | number,
  U extends string[] = ToArr<T>
  // 把T转成元组，依次匹配首项和尾项
> = U extends [infer L, ...infer Rest extends string[], infer R]
  ? L extends R
    // 满足则取出首尾项递归
    ? IsPalindrome<T, Rest>
    : false
  : true;

// 另一种解法
// 因为字符串在没有指定字符进行匹配时，无法直接匹配首尾字符, 先匹配出第一个字符L
type IsPalindrome<T extends string | number> =
  `${T}` extends `${infer L}${infer R}`
    ? R extends ""
      ? true
      : // 再匹配L是否在首尾
      `${T}` extends `${L}${infer Rest}${L}`
      ? IsPalindrome<Rest>
      : false
    : true;
```

### Mutable Keys

>实现类型`MutableKeys`，它将所有可变(非只读)键选择到一个联合中。

```ts
/* _____________ Test Cases _____________ */
type test1 = MutableKeys<{ a: number; readonly b: string }>; // 'a'
type test2 = MutableKeys<{ a: undefined; readonly b: undefined }>; // 'a'
type test3 = MutableKeys<{
  a: undefined;
  readonly b?: undefined;
  c: string;
  d: null;
}>; // 'a' | 'c' | 'd'
type test4 = MutableKeys<{}>; // never


/* _____________ Your Code Here _____________ */
// 判断两个类型是否相等
type IsEqual<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B
  ? 1
  : 2
  ? true
  : false;

type MutableKeys<T> = keyof {
  [K in keyof T as IsEqual<
    // 以K构建一个对象类型，判断是否和去掉只读属性修饰符的类型相等
    { [P in K]: T[P] },
    { -readonly [P in K]: T[P] }
    // 相等则证明K没有只读属性修饰符
  > extends true
    ? K
    : never]: K;
};
```

### Intersection

>实现类似`Lodash.intersection`的类型版本。

```ts
/* _____________ Test Cases _____________ */
type test1 = Intersection<[[1, 2], [2, 3], [2, 2]]>; // 2
type test2 = Intersection<[[1, 2, 3], [2, 3, 4], [2, 2, 3]]>; // 2 | 3
type test3 = Intersection<[[1, 2], [3, 4], [5, 6]]>; // never
type test4 = Intersection<[[1, 2, 3], [2, 3, 4], 3]>; // 3
type test5 = Intersection<[[1, 2, 3], 2 | 3 | 4, 2 | 3]>; // 2 | 3
type test6 = Intersection<[[1, 2, 3], 2, 3]>; // never


/* _____________ Your Code Here _____________ */
// 两个联合类型交叉取交集，unknown与其他类型组成交叉类型还是其他类型
type e = (1 | 2) & (2 | 3 | 1) & unknown; // 1 | 2

type ToUnion<T> = T extends unknown[] ? T[number] : T;

type Intersection<T> = T extends [infer F, ...infer R]
  // 遍历数组，取每一项交叉
  ? ToUnion<F> & Intersection<R>
  : unknown;
```


### Binary to Decimal

```ts
todo
```

### Object Key Paths

>获取`.get (lodash函数)`可以调用的所有可能路径，以获取对象的值，实现类型版本。

```ts
/* _____________ Test Cases _____________ */

type ExpectExtends<VALUE, EXPECTED> = EXPECTED extends VALUE ? true : false;

const ref = {
  count: 1,
  person: {
    name: "cattchen",
    age: 22,
    books: ["book1", "book2"],
    pets: [
      {
        type: "cat",
      },
    ],
  },
};

type a = ObjectKeyPaths<{ a: ["book1", "book2"] }>;

type test1 = ObjectKeyPaths<{ name: string; age: number }>; // 'name' | 'age'

type test2 = ObjectKeyPaths<{
  refCount: number;
  person: { name: string; age: number };
}>; // 'refCount' | 'person' | 'person.name' | 'person.age'

type test3 = ExpectExtends<ObjectKeyPaths<typeof ref>, "count">;
type test4 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person">;
type test5 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.name">;
type test6 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.age">;
type test7 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.books">;
type test8 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.pets">;
type test9 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.books.0">;
type test10 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.books.1">;
type test11 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.books[0]">;
type test12 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.books.[0]">;
type test13 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.pets.0.type">;
type test14 = ExpectExtends<ObjectKeyPaths<typeof ref>, "notExist">; // false
type test15 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.notExist">; // false
type test16 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.name.">; // false
type test17 = ExpectExtends<ObjectKeyPaths<typeof ref>, ".person.name">; // false
type test18 = ExpectExtends<ObjectKeyPaths<typeof ref>, "person.pets.[0]type">; // false


/* _____________ Your Code Here _____________ */
// 拼接路径
// 根对象下的路径不用拼接，通过[Perfix] extends [never]判断
type GetPath<K extends string | number, Prefix extends string = ""> = [
  Prefix
] extends [never]
  ? `${K}`
  :
      | `${Prefix}.${K}`
      // 如果K是number类型（兼容数组场景），特殊处理不同读取格式
      | (K extends number ? `${Prefix}[${K}]` | `${Prefix}.[${K}]` : never);

type ObjectKeyPaths<T extends object, R extends string = never> =
  | R
  | {
      [K in keyof T & (string | number)]: T[K] extends object
        // 如果T[K]是对象，拼接后继续递归
        ? ObjectKeyPaths<T[K], GetPath<K, R>>
        : GetPath<K, R>;
    }[keyof T & (string | number)];


// 另一种解法
type GetPath<K extends number | string, IsRoot extends boolean> = IsRoot extends true
  ? `${K}`
  // 处理数组的读取格式
  : `.${K}` | (K extends number ? `[${K}]` | `.[${K}]` : never);

// IsRoot表示根节点，根节点下的属性访问路径不需要处理
type ObjectKeyPaths<
  T extends object,
  IsRoot extends boolean = true,
  K extends keyof T = keyof T
> = K extends string | number
  ?
      | GetPath<K, IsRoot>
      | (T[K] extends object
          // 拼接路径
          ? `${GetPath<K, IsRoot>}${ObjectKeyPaths<T[K], false>}`
          : never)
  : never;
```

### Two Sum

>实现类型版本的两数之和。

```ts
todo
```

### ValidData

>实现一个类型判断传入的`T`是否为有效日期。

```ts
todo
/* _____________ Test Cases _____________ */
type test1 = ValidDate<"0102">; // true
type test2 = ValidDate<"0131">; // true
type test3 = ValidDate<"1231">; // true
type test4 = ValidDate<"0229">; // false
type test5 = ValidDate<"0100">; // false
type test6 = ValidDate<"0132">; // false
type test7 = ValidDate<"1301">; // false
type test8 = ValidDate<"0123">; // true
type test9 = ValidDate<"01234">; // false
type test10 = ValidDate<"">; // false


/* _____________ Your Code Here _____________ */
type Num = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type MM = `0${Num}` | `1${0 | 1 | 2}`;

// 列出所有合法的日期
type AllDate =
  | `${MM}${`${0}${Num}` | `${1}${0 | Num}` | `2${0 | Exclude<Num, 9>}`}`
  | `${Exclude<MM, "02">}${29 | 30}`
  | `${Exclude<MM, "02" | "04" | "06" | "09" | "11">}${31}`;

type ValidDate<T extends string> = T extends AllDate ? true : false;
```

### Assign 

>有一个目标对象和一个源对象数组。将属性从源复制到目标，如果它具有与源相同的属性，保留源属性，并删除目标属性。

```ts
/* _____________ Test Cases _____________ */
// case1
type Case1Target = {};

type Case1Origin1 = {
  a: "a";
};

type Case1Origin2 = {
  b: "b";
};

type Case1Origin3 = {
  c: "c";
};

type Case1Answer = {
  a: "a";
  b: "b";
  c: "c";
};

// case2
type Case2Target = {
  a: [1, 2, 3];
};

type Case2Origin1 = {
  a: {
    a1: "a1";
  };
};

type Case2Origin2 = {
  b: [2, 3, 3];
};

type Case2Answer = {
  a: {
    a1: "a1";
  };
  b: [2, 3, 3];
};

// case3

type Case3Target = {
  a: 1;
  b: ["b"];
};

type Case3Origin1 = {
  a: 2;
  b: {
    b: "b";
  };
  c: "c1";
};

type Case3Origin2 = {
  a: 3;
  c: "c2";
  d: true;
};

type Case3Answer = {
  a: 3;
  b: {
    b: "b";
  };
  c: "c2";
  d: true;
};

// case 4
type Case4Target = {
  a: 1;
  b: ["b"];
};

type Case4Answer = {
  a: 1;
  b: ["b"];
};

type test1 = Assign<Case1Target, [Case1Origin1, Case1Origin2, Case1Origin3]>; // Case1Answer
type test2 = Assign<Case2Target, [Case2Origin1, Case2Origin2]>; // Case2Answer
type test3 = Assign<Case3Target, [Case3Origin1, Case3Origin2]>; // Case3Answer
type test4 = Assign<Case4Target, ["", 0]>; // Case4Answer


/* _____________ Your Code Here _____________ */
// 排除非对象类型的合并
type Merge<A, B> = B extends object
  ? {
      // K如果是B的key，那么就取B[K]，否则就取A[K]
      [K in keyof A | keyof B]: K extends keyof B
        ? B[K]
        : K extends keyof A
        ? A[K]
        : never;
    }
  : A;

type Assign<
  T extends Record<string, unknown>,
  U extends unknown[]
// 遍历数组，依次进行合并
> = U extends [infer F, ...infer R] ? Assign<Merge<T, F>, R> : T;
```

### Maximum

```ts
/* _____________ Test Cases _____________ */
type test1 = Maximum<[]>; //never
type test2 = Maximum<[0, 2, 1]>; //2
type test3 = Maximum<[1, 20, 200, 150]>; //200


/* _____________ Your Code Here _____________ */
type Maximum<
  T extends any[],
  U = T[number],
  N extends any[] = []
> = T extends []
  ? never
  // 这里就找到了满足条件的最大成员
  : Equal<U, N["length"]> extends true
  ? U
  // U extends N["length"] ? never : U -> 可以排除U中满足N['length']的成员
  // [...N, unknown] -> 不断扩大数组，这样会依次排除最小的成员
  : Maximum<T, U extends N["length"] ? never : U, [...N, unknown]>;
```

### Capitalize Nest Object Keys

>将对象的键大写，如果值是数组，则遍历数组中的对象。

```ts
/* _____________ Test Cases _____________ */
type foo = {
  foo: string;
  bars: [{ foo: string }];
};

type Foo = {
  Foo: string;
  Bars: [
    {
      Foo: string;
    }
  ];
};

type test1 = CapitalizeNestObjectKeys<foo>; // Foo


/* _____________ Your Code Here _____________ */
type CapitalizeNestObjectKeys<T> = T extends unknown[]
  ? T extends [infer F, ...infer R]
    // T如果是数组类型就递归处理每个成员
    ? [CapitalizeNestObjectKeys<F>, ...CapitalizeNestObjectKeys<R>]
    : []
  : {
      // 把K 重映射 为大写开头
      [K in keyof T as Capitalize<K & string>]: T[K] extends unknown[]
        ? CapitalizeNestObjectKeys<T[K]>
        : T[K];
    };

```

### Replace Union

>给定一个类型联合和要替换的类型对数组`([[string, number]， [Date, null]])`，返回一个用类型对替换的新联合。

```ts
/* _____________ Test Cases _____________ */
// string -> null
type test1 = UnionReplace<number | string, [[string, null]]>; // number | null

// Date -> string; Function -> undefined
type test2 = UnionReplace<
  Function | Date | object,
  [[Date, string], [Function, undefined]]
>; // undefined | string | object


/* _____________ Your Code Here _____________ */
// 思路：遍历U，在联合类型T中替换指定类型
type UnionReplace<T, U extends [any, any][]> = U extends [
  infer F extends [any, any],
  ...infer R extends [any, any][]
]
  // 假设T为number | string，F[0]为string，这里触发分布式条件类型
  // 当执行到string extends string时，满足条件得到F[1]，number不满足条件得到原值
  // 最后就是number | F[1]，所以结果就是number | null
  ? UnionReplace<T extends F[0] ? F[1] : T, R>
  : T;
```

### FizzBuzz 

```ts
todo
```

### Run-length encoding

```ts
todo
```

### Tree path array

>创建类型`Path`，该类型表示以数组形式验证树的可能路径。

```ts
/* _____________ Test Cases _____________ */
type ExpectExtends<VALUE, EXPECTED> = EXPECTED extends VALUE ? true : false;

declare const example: {
  foo: {
    bar: {
      a: string;
    };
    baz: {
      b: number;
      c: number;
    };
  };
};

// Possible solutions:
// []
// ['foo']
// ['foo', 'bar']
// ['foo', 'bar', 'a']
// ['foo', 'baz']
// ['foo', 'baz', 'b']
// ['foo', 'baz', 'c']

type test1 = ExpectExtends<Path<(typeof example)["foo"]["bar"]>, ["a"]>;
type test2 = ExpectExtends<Path<(typeof example)["foo"]["baz"]>, ["b"] | ["c"]>;
type test3 = ExpectExtends<
  Path<(typeof example)["foo"]>,
  ["bar"] | ["baz"] | ["bar", "a"] | ["baz", "b"] | ["baz", "c"]
>;
type test4 = ExpectExtends<Path<(typeof example)["foo"]["bar"]>, ["z"]>;


/* _____________ Your Code Here _____________ */
type Path<T> = {
  // 如果T[K]是对象类型，则把这个K放到数组中并且递归调用Path<T[K]>（即K和K的子key在同一个数组）
  [K in keyof T]: [K] | (T[K] extends object ? [K, ...Path<T[K]>] : never);
}[keyof T];
```

### SnakeCase

>创建一个`SnakeCase<T>`泛型，将以`camelCase`格式格式化的字符串转换为以`snake`格式格式化的字符串。


```ts
/* _____________ Test Cases _____________ */
type test1 = SnakeCase<"hello">; // 'hello'
type test2 = SnakeCase<"userName">; // 'user_name'
type test3 = SnakeCase<"getElementById">; // 'get_element_by_id'
type test4 = SnakeCase<"getElementById" | "getElementByClassNames">; // 'get_element_by_id' | 'get_element_by_class_names'


/* _____________ Your Code Here _____________ */
// U存储格式化后的T
type SnakeCase<T, U extends string = ""> = T extends `${infer F}${infer R}`
  // 遍历T，如果遍历到的字符是大写则转为小写拼接，否则直接拼接
  ? SnakeCase<R, `${U}${F extends Capitalize<F> ? "_" : ""}${Uncapitalize<F>}`>
  : U;

// 另一种解法
type SnakeCase<T> = T extends `${infer F}${infer R}`
  ? F extends Capitalize<F>
    ? `_${Uncapitalize<F>}${SnakeCase<R>}`
    : `${F}${SnakeCase<R>}`
  : "";
```

### IsNegativeNumber

>实现一个类型判断是否是负数。

```ts
/* _____________ Test Cases _____________ */
type test1 = IsNegativeNumber<0>; // false
type test2 = IsNegativeNumber<number>; // never
type test3 = IsNegativeNumber<-1 | -2>; // never
type test4 = IsNegativeNumber<-1>; // true
type test5 = IsNegativeNumber<-1.9>; // true
type test6 = IsNegativeNumber<-100_000_000>; // true
type test7 = IsNegativeNumber<1>; // false
type test8 = IsNegativeNumber<1.9>; // false
type test9 = IsNegativeNumber<100_000_000>; // false


/* _____________ Your Code Here _____________ */
// 判断类型是否是联合类型
type IsUnion<T, U = T> = T extends T ? ([U] extends [T] ? false : true) : never;

type IsNegativeNumber<T extends number> = IsUnion<T> extends true
  ? never
  : number extends T
  // 联合类型、number类型返回never
  ? never
  // 判断是否匹配到负号-，并且约束推导出来的_类型为number
  : `${T}` extends `-${infer _ extends number}`
  ? true
  : false;
```

### OptionalUndefined

>实现`util`类型`OptionalUndefined<T, Props>`，它将`T`中所有可以未定义的属性转换为可选属性。此外，可以传递第二个可选的泛型`Props`来限制可以修改的属性。

```ts
/* _____________ Test Cases _____________ */
type test1 = OptionalUndefined<{ value: string | undefined }, "value">; // { value?: string | undefined }
type test2 = OptionalUndefined<{ value: string; desc: string }, "value">; // { value: string; desc: string }
type test3 = OptionalUndefined<
  { value: string | undefined; desc: string },
  "value"
>; // { value?: string; desc: string }
type test4 = OptionalUndefined<
  { value: string | undefined; desc: string | undefined },
  "value"
>; // { value?: string | undefined; desc: string | undefined }
type test5 = OptionalUndefined<
  { value: string | undefined; desc: string },
  "value" | "desc"
>; // { value?: string; desc: string }
type test6 = OptionalUndefined<{
  value: string | undefined;
  desc: string | undefined;
}>; // { value?: string; desc?: string }
type test7 = OptionalUndefined<{ value?: string }, "value">; // { value?: string }
type test8 = OptionalUndefined<{ value?: string }>; // { value?: string }


/* _____________ Your Code Here _____________ */
// Omit<x, never>相当于把x原封不动的复制一份
type OptionalUndefined<T, Props extends keyof T = keyof T> = Omit<
  {
    // 排除Props中的属性名
    [K in Exclude<keyof T, Props>]: T[K];
  } & {
    // 如果T[K]包含undefined类型，给K添加可选属性修饰符
    [K in Props as undefined extends T[K] ? K : never]?: T[K];
  } & {
    [K in Props as undefined extends T[K] ? never : K]: T[K];
  },
  never
>;


// 另一种解法
type OptionalUndefined<
  T,
  Props extends keyof T = keyof T,
  // Props extends keyof T触发分布式条件类型
  OptionalProps extends keyof T = Props extends keyof T
    // 排除Props中不包含undefined类型的属性名
    ? undefined extends T[Props]
      ? Props
      : never
    : never
> = Omit<
  {
    [K in OptionalProps]?: T[K];
  } & {
    [K in Exclude<keyof T, OptionalProps>]: T[K];
  },
  never
>;
```

## extreme

### Get Readonly Keys 

>实现泛型`GetReadonlyKeys<T>`，`GetReadonlyKeys<T>`返回由对象`T`所有只读属性的键组成的联合类型。

```ts
/* _____________ Test Cases _____________ */
interface Todo1 {
  readonly title: string;
  description: string;
  completed: boolean;
}

interface Todo2 {
  readonly title: string;
  readonly description: string;
  completed?: boolean;
}

type test1 = GetReadonlyKeys<Todo1>; // 'title'
type test2 = GetReadonlyKeys<Todo2>; // 'title' | 'description'


/* _____________ Your Code Here _____________ */
type IsEqual<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B
  ? 1
  : 2
  ? true
  : false;

type GetReadonlyKeys<T> = keyof {
  // 遍历T的所有属性
  [K in keyof T as IsEqual<
    // 比较原属性和去除修饰符后的属性是否相等
    { -readonly [P in K]: T[P] },
    { [P in K]: T[P] }
  > extends true
    ? never
    // 如果不相等，返回属性名（只读属性）
    : K]: K;
};
```

### Query String Parser

>实现类型级解析器来将`URL`查询字符串解析为对象文字类型。


```ts
/* _____________ Test Cases _____________ */
type test1 = ParseQueryString<"">; // {}
type test2 = ParseQueryString<"k1">; // { k1: true }
type test3 = ParseQueryString<"k1&k1">; // { k1: true }
type test4 = ParseQueryString<"k1&k2">; // { k1: true; k2: true }
type test5 = ParseQueryString<"k1=v1">; // { k1: 'v1' }
type test6 = ParseQueryString<"k1=v1&k1=v2">; // { k1: ['v1', 'v2'] }
type test7 = ParseQueryString<"k1=v1&k2=v2">; // { k1: 'v1'; k2: 'v2' }
type test8 = ParseQueryString<"k1=v1&k2=v2&k1=v2">; // { k1: ['v1', 'v2']; k2: 'v2' }
type test9 = ParseQueryString<"k1=v1&k2">; // { k1: 'v1'; k2: true }
type test10 = ParseQueryString<"k1=v1&k1=v1">; // { k1: 'v1' }
type test11 = ParseQueryString<"k1=v1&k1=v2&k1=v1">; // { k1: ['v1', 'v2'] }
type test12 = ParseQueryString<"k1=v1&k2=v1&k1=v2&k1=v1">; // { k1: ['v1', 'v2']; k2: 'v1' }
type test13 = ParseQueryString<"k1=v1&k2=v2&k1=v2&k1=v3">; // { k1: ['v1', 'v2', 'v3']; k2: 'v2' }
type test14 = ParseQueryString<"k1=v1&k1">; // { k1: ['v1', true] }
type test15 = ParseQueryString<"k1&k1=v1">; // { k1: [true, 'v1'] }


/* _____________ Your Code Here _____________ */
type ArrayToString<T> = T extends unknown[]
  ? T extends [infer F, ...infer R]
    ? `${F & string}${ArrayToString<R>}`
    : ""
  : T;

// 合并两个对象
type Merge<O, T> = {
  // 遍历它们所有的key
  [K in keyof O | keyof T]: K extends keyof T
    ? K extends keyof O
      // 如果key在两个对象中都存在，判断O[K]的属性类型是否满足赋值给T[K]
      // 假设O[K]为['v1', 'v2'] -> ArrayToString<O[K]>为'v1v2'
      // 假设T[K]为'v1'，则'v1v2' extends  `${any}v1${any}` | 'v1'为true
      // 因为排除了重复的类型添加进数组
      ? ArrayToString<O[K]> extends `${any}${T[K] & string}${any}` | T[K]
        ? O[K]
        // 不满足则都添加进数组
        : [
            ...(O[K] extends any[] ? O[K] : [O[K]]),
            ...(T[K] extends any[] ? T[K] : [T[K]])
          ]
      : T[K]
    : K extends keyof O
    ? O[K]
    : never;
};

type ParseQueryString<
  S extends string,
  O extends Record<string, any> = {}
  // 以&分割匹配前面的L和后面的R
> = S extends `${infer L}&${infer R}`
  ? ParseQueryString<
      R,
      Merge<
        O,
        // 用L以=分割匹配前面的LL和后面的LR
        L extends `${infer LL}=${infer LR}`
          ? { [K in LL]: LR }
          : // 没匹配上，就以L作为属性名，类型为true
            { [K in L]: true }
      >
    >
  : // 如果不匹配&，就匹配=，以=分割匹配前面的LL和后面的LR
    Merge<
      O,
      S extends `${infer LL}=${infer LR}`
        ? { [K in LL]: LR }
        : { [K in S as S extends "" ? never : K]: true }
    >;
```

### Slice 

>实现`Array.slice`的类型版本。

```ts
/* _____________ Test Cases _____________ */
type Arr = [1, 2, 3, 4, 5];

// basic
type test1 = Slice<Arr, 0, 1>; // [1]
type test2 = Slice<Arr, 0, 0>; // []
type test3 = Slice<Arr, 2, 4>; // [3, 4]

// optional args
type test4 = Slice<[]>; // []
type test5 = Slice<Arr>; // Arr
type test6 = Slice<Arr, 0>; // Arr
type test7 = Slice<Arr, 2>; // [3, 4, 5]

// negative index
type test8 = Slice<Arr, 0, -1>; // [1, 2, 3, 4]
type test9 = Slice<Arr, -3, -1>; // [3, 4]

// invalid
type test10 = Slice<Arr, 10>; // []
type test11 = Slice<Arr, 1, 0>; // []
type test12 = Slice<Arr, 10, 20>; // []


/* _____________ Your Code Here _____________ */
// 构建数组
type NewArray<N extends number, T extends 1[] = []> = T["length"] extends N
  ? T
  : NewArray<N, [...T, 1]>;

// 两数相减
type Sub<A extends number, B extends number> = NewArray<A> extends [
  ...NewArray<B>,
  ...infer R
]
  ? R["length"]
  : never;

// 把负数索引转为正数索引
type GetIndex<
  I extends number,
  T extends unknown[]
  // 匹配出负号，等到正数，然后用数组长度减去这个正数，即为负数索引对应的正数索引
> = `${I}` extends `-${infer N extends number}` ? Sub<T["length"], N> : I;

type Slice<
  Arr extends unknown[],
  Start extends number = 0,
  End extends number = Arr["length"],
  // S: 起始索引（通过转换后的
  S extends number = GetIndex<Start, Arr>,
  // E: 结束索引（通过转换后的
  E extends number = GetIndex<End, Arr>,
  // 计数
  Count extends 1[] = [],
  // 切割后的数组
  Res extends unknown[] = [],
  // 是否开始往结果数组里放入元素
  Flag extends boolean = Count["length"] extends S ? true : false
  // 如果到了结束索引，就返回结果
> = Count["length"] extends E
  ? Res
  : Arr extends [infer F, ...infer R]
  // 判断Flag是否满足true，如果满足，就把当前元素放入结果数组
  ? Flag extends true
    ? Slice<R, Start, End, S, E, [...Count, 1], [...Res, F], Flag>
    : Slice<
        R,
        Start,
        End,
        S,
        E,
        [...Count, 1],
        // 改变flag时也要追加一次结果数组
        Count["length"] extends S ? [...Res, F] : Res,
        Count["length"] extends S ? true : false
      >
  : Res;

// 另一种解法
// 处理负数索引
type ToPositive<
  N extends number,
  Arr extends unknown[]
  // 假设N为-1，Arr为[1, 2, 3]，则P为1，Slice<[1, 2, 3], 1> -> Slice<Arr, 1, 3> -> [2, 3]
> = `${N}` extends `-${infer P extends number}` ? Slice<Arr, P>["length"] : N;

// 获取Arr的前N个元素
type InitialN<
  Arr extends unknown[],
  N extends number,
  Res extends unknown[] = []
> = Res["length"] extends N | Arr["length"]
  ? Res
  : InitialN<Arr, N, [...Res, Arr[Res["length"]]]>;

type Slice<
  Arr extends unknown[],
  Start extends number = 0,
  End extends number = Arr["length"]
  // 获取到Arr的前Start个元素，再获取到Arr的前End个元素做匹配
> = InitialN<Arr, ToPositive<End, Arr>> extends [
  ...InitialN<Arr, ToPositive<Start, Arr>>,
  ...infer Rest
]
  // 取出两者差集
  ? Rest
  : [];
```

### Currying 2

>实现动态参数化的柯里化函数的类型版本。


```ts
/* _____________ Test Cases _____________ */
const curried1 = DynamicParamsCurrying(
  (a: string, b: number, c: boolean) => true
);
const curried2 = DynamicParamsCurrying(
  (
    a: string,
    b: number,
    c: boolean,
    d: boolean,
    e: boolean,
    f: string,
    g: boolean
  ) => true
);

const curried1Return1 = curried1("123")(123)(true);
const curried1Return2 = curried1("123", 123)(false);
const curried1Return3 = curried1("123", 123, true);

const curried2Return1 = curried2("123")(123)(true)(false)(true)("123")(false);
const curried2Return2 = curried2("123", 123)(true, false)(true, "123")(false);
const curried2Return3 = curried2("123", 123)(true)(false)(true, "123", false);
const curried2Return4 = curried2("123", 123, true)(false, true, "123")(false);
const curried2Return5 = curried2("123", 123, true)(false)(true)("123")(false);
const curried2Return6 = curried2("123", 123, true, false)(true, "123", false);
const curried2Return7 = curried2("123", 123, true, false, true)("123", false);
const curried2Return8 = curried2("123", 123, true, false, true)("123")(false);
const curried2Return9 = curried2("123", 123, true, false, true, "123")(false);
const curried2Return10 = curried2("123", 123, true, false, true, "123", false);

type test1 = typeof curried1Return1; // boolean
type test2 = typeof curried1Return2; // boolean
type test3 = typeof curried1Return3; // boolean
type test4 = typeof curried2Return1; // boolean
type test5 = typeof curried2Return2; // boolean
type test6 = typeof curried2Return3; // boolean
type test7 = typeof curried2Return4; // boolean
type test8 = typeof curried2Return5; // boolean
type test9 = typeof curried2Return6; // boolean
type test10 = typeof curried2Return7; // boolean
type test11 = typeof curried2Return8; // boolean
type test12 = typeof curried2Return9; // boolean
type test13 = typeof curried2Return10; // boolean


/* _____________ Your Code Here _____________ */
declare function DynamicParamsCurrying<A extends unknown[], R>(
  fn: (...args: A) => R
): Curry<A, R>;

// 利用泛型推导推出Args的类型
type Curry<A extends unknown[], R> = <Args extends unknown[]>(
  ...args: Args
  // 匹配出剩余的参数
) => A extends [...Args, ...infer Rest]
  ? Rest["length"] extends 0
    ? R
    // 如果存在剩余参数，继续递归
    : Curry<Rest, R>
  : never;
```

### Sum 

```ts
todo
```

### Multiply 

```ts
todo
```

### Tag

```ts
todo
```

### Inclusive Range

>给定两个整数，取出之间的范围，包括边界。

```ts
/* _____________ Test Cases _____________ */
type test1 = InclusiveRange<200, 1>; // []
type test2 = InclusiveRange<10, 5>; // []
type test3 = InclusiveRange<5, 5>; // [5]
type test4 = InclusiveRange<0, 10>; // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
type test5 = InclusiveRange<1, 200>; // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200]
type test6 = InclusiveRange<22, 146>; // [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146]


/* _____________ Your Code Here _____________ */
type InclusiveRange<
  Lower extends number,
  Higher extends number,
  // 计数
  C extends any[] = [],
  // 存储开关
  F = false,
  // 存储结果
  R extends number[] = []
> = F extends true
  // 计数达到上限Higher时
  ? C["length"] extends Higher
    ? [...R, C["length"]]
    // 没达到上限 && 开关F开启
    : InclusiveRange<Lower, Higher, [...C, 1], true, [...R, C['length']]>
  // 计数没达到下限Lower时，不用存
  : C['length'] extends Lower
    ? InclusiveRange<Lower, Higher, C, true>
    // 边界条件判断，上限比下限小时
    : C['length'] extends Higher
      ? []
      // 计数+1
      : InclusiveRange<Lower, Higher, [...C, 1], false>;
```


### Sort 

>按升序或降序对自然数数组进行排序。

```ts
/* _____________ Test Cases _____________ */
type test1 = Sort<[]>; // []
type test2 = Sort<[1]>; // [1]
type test3 = Sort<[2, 1]>; // [1, 2]
type test4 = Sort<[0, 0, 0]>; // [0, 0, 0]
type test5 = Sort<[1, 2, 3]>; // [1, 2, 3]
type test6 = Sort<[3, 2, 1]>; // [1, 2, 3]
type test7 = Sort<[3, 2, 1, 2]>; // [1, 2, 2, 3]
type test8 = Sort<[3, 2, 0, 1, 0, 0, 0]>; // [0, 0, 0, 0, 1, 2, 3]
type test9 = Sort<[2, 4, 7, 6, 6, 6, 5, 8, 9]>; // [2, 4, 5, 6, 6, 6, 7, 8, 9]
type test10 = Sort<[1, 1, 2, 1, 1, 1, 1, 1, 1]>; // [1, 1, 1, 1, 1, 1, 1, 1, 2]
type test11 = Sort<[], true>; // []
type test12 = Sort<[1], true>; // [1]
type test13 = Sort<[2, 1], true>; // [2, 1]
type test14 = Sort<[0, 0, 0], true>; // [0, 0, 0]
type test15 = Sort<[1, 2, 3], true>; // [3, 2, 1]
type test16 = Sort<[3, 2, 1], true>; // [3, 2, 1]
type test17 = Sort<[3, 2, 1, 2], true>; // [3, 2, 2, 1]
type test18 = Sort<[3, 2, 0, 1, 0, 0, 0], true>; // [3, 2, 1, 0, 0, 0, 0]
type test19 = Sort<[2, 4, 7, 6, 6, 6, 5, 8, 9], true>; // [9, 8, 7, 6, 6, 6, 5, 4, 2]

```

### DistributeUnions 

```ts
todo
```

### Assert Array Index

```ts
todo
```

### JSON Parser

```ts
todo
```

### Subtract 

```ts
todo
```
