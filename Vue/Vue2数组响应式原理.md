### Vue数组响应式原理

>`vue`源码中的实现, 源码位置`src/core/observer/array.js`

```js
// def是通过Object.defineProperty给对象定义属性的一个方法
import { def } from '../util/index'

// 获取数组原型
const arrayProto = Array.prototype
// 创建一个以数组原型为原型的对象
export const arrayMethods = Object.create(arrayProto)
// 改变数组自身的7个方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
// 给创建的对象添加这7个方法
methodsToPatch.forEach(function (method) {
  // 获取数组原型上的同名方法
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    // 先把数组原型上的方法调用一遍
    const result = original.apply(this, args)
    // 获取这个数组的__ob__属性,也就是它的观察者实例
    const ob = this.__ob__
    let inserted
    switch (method) {
      // 如果是push/unshift方法,传入的参数就是新添加的值
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        // 如果是splice方法
        // args.slice(2)就是新添加的值
        inserted = args.slice(2)
        break
    }
    // 如果有新添加的值,就对这个新值做观察监听
    if (inserted) ob.observeArray(inserted)
    // 通知依赖更新
    ob.dep.notify()
    // 返回数组原型方法调用的结果
    return result
  })
})
```

**`Observer`类中对数组的处理**

>源码位置`src/core/observer/index.js`

```js
// arrayMethods是上面处理过的对象
import { arrayMethods } from './array'
class Observer {
  constructor(value) {
    // ...
    // 如果value是数组
    if (Array.isArray(value)) {
      // 判断当前执行环境是否支持__proto__属性
      if (hasProto) {
        // 如果有__proto__属性,就把arrayMethods设为value的原型
        protoAugment(value, arrayMethods)
      } else {
        // 如果不支持__proto__属性
        // 则调用copyAugment函数把arrayMethods中重写的7个方法循环加入到value自身中
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 遍历value,对每项成员做监听
      observeArray(value)
    // value是对象的处理
    } else {
      // ...
    }
  }
}
// 能力检测: 判断__proto__是否可用,因为有的浏览器不支持该属性
const hasProto = '__proto__' in {}
// 获取arrayMethods的所有属性名 - 增强的那7个方法
const arraykeys = Object.getOwnPropertyNames(arrayMethods)
// 设置target的__proto__属性(非标准属性)
function protoAugment (target, src, keys) {
  target.__proto__ = src
}
// 把keys上的属性及属性值拷贝到target自身上
function copyAugment (target, src, keys) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}
```

可以看到`vue`会创建一个以数组原型为原型的对象`arrayMethod`,然后在这个对象上定义了改变数组自身的7个方法,先把数组原型方法调用一遍,如果调用的是`push`,`unshift`,`splice`方法,则会判断是否有新添元素,如果有,会对新元素做观察监听,最后通知依赖更新。在`Observer`类中,如果传入的是数组,先判断当前环境是否支持`__proto__`属性,如果支持则给这个数组重新设置原型为`arrayMethod`,不支持就循环`arrayMethod`把这7个方法加入到这个数组中。

**总结:** Vue通过原型拦截的方式重写了数组的7个方法(改变数组自身),首先会将数组方法名对应的原始方法调用一遍,然后获取到这个数组的ob属性(被转为响应式后的一个标记),也就是它的Observer对象,如果有新的值,就对新的值进行监听,最后会手动调用notify,派发更新,Vue还会遍历数组中的每一项,如果有对象类型的话也会做响应式处理