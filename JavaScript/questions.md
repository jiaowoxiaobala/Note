
### 1. 使`a == 1 && a == 2 && a == 3`成立

[MDN: Symbol.toPrimitive](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive)

[MDN：Object.prototype.valueOf](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)

[MDN: Object.prototype.toString](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)

```js
const a = {
  value: 1,
  // toString
  // [Symbol.toPrimitive]
  valueOf: function () {
    return this.value++;
  },
};

console.log(a == 1 && a == 2 && a == 3);// true
```


### 2. 实现`sum`函数，参数为数组，求该数组所有项之和，不允许使用循环和数组方法

```js
const arr = [1, 2, 3, 4, 5];

// 递归求和 - 从后向前加
function sum(arr, idx = arr.length - 1) {
  if (idx === 0) return arr[idx];
  return arr[idx] + sum(arr, idx - 1);
}

// 从前向后加
function sum(arr, idx = 0) {
  if (idx === arr.length - 1) return arr[idx]
  return arr[idx] + sum(arr, idx + 1)
}
```


### 3. 如何`for...of`对象

[MDN: Symbol.iterator](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator)

>扩展（为什么对象没有迭代器但能解构）: https://www.zhihu.com/question/537534257

```js
// MDN: Symbol.iterator为每一个对象定义了默认的迭代器。该迭代器可以被 for...of 循环使用
const obj = {
  name: "bowen",
  age: 18,
};

// 自定义迭代器
function ObjectIterator() {
  const keys = Object.keys(this);
  return {
    next: () => {
      if (!keys.length) {
        return {
          value: undefined,
          done: true,
        };
      }
      return {
        value: this[keys.shift()],
        done: false,
      };
    },
  };
}

// 挂载到原型上
Object.prototype[Symbol.iterator] = ObjectIterator;

for (const value of obj) {
  console.log(value)
}
```

### 4.闭包是什么，有什么用途？


### 5.事件循环