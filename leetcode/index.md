
### 无重复字符的最长子串

给定一个字符串`s` ，请你找出其中不含有重复字符的 最长子串 的长度。

```js
// 用字符串（也可以换成数组）维护一个滑动窗口
function lengthOfLongestSubstring(s) {
  let max = 0;
  let str = "";
  for (let i = 0; i < s.length; i++) {
    // 判断这个窗口中是否存在这个字符
    const idx = str.indexOf(s[i]);

    if (idx === -1) {
      // 不存在则扩大窗口
      str += s[i];
      // 更新窗口的最大值
      max = Math.max(max, str.length);
    } else {
      // 存在则移动窗口
      // abc => abca => bca
      str = str.substr(idx + 1) + s[i];
    }
  }
  return max;
}

// 另一种思路
// 双指针维护滑动窗口
function lengthOfLongestSubstring(s) {
  let max = 0;
  for (let i = 0, j = 0; j < s.length; j++) {
    // 判断这个窗口中是否存在s[j]
    const idx = s.substring(i, j).indexOf(s[j]);
    // 如果存在，则缩小窗口
    if (idx !== -1) {
      i = i + idx + 1;
    }
    // 更新窗口最大值
    max = Math.max(max, j - i + 1);
  }
  return max;
}
```