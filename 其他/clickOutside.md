
## 侦听指定元素之外的点击

>[useOnClickOutside](https://usehooks-ts.com/react-hook/use-on-click-outside)，`usehooks-ts`中的实现。

```tsx
// react usehooks中的实现
import { RefObject } from 'react'

import { useEventListener } from 'usehooks-ts'

type Handler = (event: MouseEvent) => void

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: Handler,
  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown',
): void {
  useEventListener(mouseEvent, event => {
    const el = ref?.current

    // 通过contains判断的
    // Do nothing if clicking ref's element or descendent elements
    if (!el || el.contains(event.target as Node)) {
      return
    }

    handler(event)
  })
}
```

>[contains](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/contains)，表示一个节点是否是给定节点的后代，即该节点本身、其直接子节点（`childNodes`）、子节点的直接子节点等。

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

>[onClickOutside](https://vueuse.org/core/onClickOutside/)，`vueuse`中的实现。

```ts
const listener = (event: PointerEvent) => {
  const el = unrefElement(target)
  if (!el || el === event.target || event.composedPath().includes(el))
    return

  // ...

  handler(event)
}
```

>[composedPath](https://developer.mozilla.org/zh-CN/docs/Web/API/Event/composedPath)，当对象数组调用该侦听器时返回事件路径。如果影子根节点被创建并且`ShadowRoot.mode`是关闭的，那么该路径不包括影子树中的节点。


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
    const btn = document.getElementById('btn')

    window.addEventListener('mousedown', (e) => {

      console.log(e.composedPath())

      // 返回包含事件流中元素的对象数组
      // 判断是否包含了btn
      if (e.composedPath().includes(btn)) {
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