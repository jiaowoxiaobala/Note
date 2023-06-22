type NewArray<N extends number, T extends unknown[] = []> = T['length'] extends N ? T : NewArray<N, [...T, unknown]>

// 如果想求两个数字相加，也就是构造这两个数字长度的元组合并后取length属性
type Add<A extends number, B extends number> = [...NewArray<A>, ...NewArray<B>]['length']

// 如果想求两个数组相减，也可以通过这种方式比较A和B的大小
type Sub<A extends number, B extends number> = NewArray<A> extends [...NewArray<B>, ...infer R] ? R['length'] : never

// 如果想求两个数字A, B相乘，也就是A + ... + A，加B次A
type Mul<A extends number, B extends number, Count extends unknown[] = []> = B extends 0
  ? Count['length']
  : Mul<A, Sub<B, 1>, [...Count, ...NewArray<A>]>

// 如果想求两个数字A, B相除，也就是A - ... -B，减到A为0
type Div<A extends number, B extends number, Count extends unknown[] = []> = A extends 0
  ? Count['length']
  : Div<Sub<A, B>, B, [...Count, unknown]>


  type a = Div<30, 5>