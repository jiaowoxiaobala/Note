
### 1. 使下面等式成立

[MDN：valueOf](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)

```js
const a = {
  value: 1,
  valueOf: function () {
    return this.value++;
  },
};

console.log(a == 1 && a == 2 && a == 3);// true
```


### 2. 实现`sum`函数，参数为数组，求该数组所有项之和，不允许使用循环和数组方法

```js
const arr = [1, 2, 3, 4, 5];

// 递归求和
function sum(arr, idx = arr.length - 1) {
  if (idx === 0) return arr[0];
  return arr[idx] + sum(arr, idx - 1);
}
```