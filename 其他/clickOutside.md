

useOnClickOutside

https://usehooks-ts.com/react-hook/use-on-click-outside

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <div id="div" style="width: 200px; height: 200px; background: pink"></div>

  <button id="btn">button</button>

  <script>
    // contains() 方法返回一个布尔值，表示一个节点是否是给定节点的后代，即该节点本身、其直接子节点（childNodes）、子节点的直接子节点等
    const btn = document.getElementById('btn')

    window.addEventListener('mousedown', (e) => {
      // 事件绑定的元素
      console.log(e.currentTarget)
      // 触发事件的元素
      console.log(e.target)

      // 触发事件的元素是btn的后代节点，或者它本身
      if (btn.contains(e.target)) {
        return
      }
      div.innerText = 'button click outside'
    })

    btn.addEventListener('click', () => {
      div.innerText = 'button click'
    })
  </script>

</body>
</html>
```