// 获取对象所有可修改的键
type OptionalKeys<T extends object> = keyof {
  [K in keyof T as { [P in K]: T[P] } extends { [P in K]-?: T[P] } ? never: K ]: T[K]
}

type a = OptionalKeys<{
  name?: string;
  age: number
}>