## 图片懒加载

### 核心思路：判断图片是否出现在可视区域，当出现在可视区域时加载图片，否则做占位或者`loading`处理。


方案1：[offsetTop](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/offsetTop) + [scrollTop](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollTop)

>`offsetTop`为只读属性，它返回当前元素相对于其`offsetParent`元素的顶部内边距的距离；一个元素的`scrollTop`值是这个元素的内容顶部（卷起来的）到它的视口可见内容（的顶部）的距离的度量。当一个元素的内容没有产生垂直方向的滚动条，那么它的`scrollTop`值为`0`。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
    <div style="height: 2000px;"></div>
    <div>
      <img data-src="http://mmbiz.qpic.cn/sz_mmbiz_gif/6a4WXcicqr58uvyz4iaOzEXP8jCIMcicRMib2au60ic8uD3Ym6op0QsoSvDgz8B8eEU3jsbXVkWII9CcQykv8aeB03Q/0?wx_fmt=gif"/>
    </div>
</head>
<body>
  <script>
    const imgs = Array.from(document.querySelectorAll('img[data-src]'))
    // 获取可视区域的高度
    const viewHight = window.innerHeight;

    // 获取元素距离页面顶部的距离
    const getTop = (el) => {
      let t = el.offsetTop
      // 这里需要循环加上所有offsetParent的offsetTop
      while (el = el.offsetParent) {
        t += el.offsetTop
      }

      return t
    }

    function lazyload () {
      if (imgs.length === 0) {
        return
      }
      // 获取页面滚动高度
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop

      for (let i = 0; i < imgs.length; i++) {
        const el = imgs[i]
        // 页面滚动高度 + 可视区域高度 > 图片距离页面顶部的距离
        // 既图片在可视区域范围内
        if (scrollTop + viewHight > getTop(el)) {
          el.src = el.getAttribute('data-src')
          el.removeAttribute('data-src')
          // 当前图片加载了，就剔除
          imgs.splice(i, 1)
          i--
        }
      }
    }

    // 加个节流
    window.addEventListener("scroll", lazyload);

    lazyload();
  </script>
</body>
</html>
```

方案2：[getBoundingClientRect](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect)

>该方法返回一个`DOMRect`对象，其提供了元素的大小及其相对于视口的位置。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
    <div style="height: 2000px;"></div>
    <div>
      <img data-src="http://mmbiz.qpic.cn/sz_mmbiz_gif/6a4WXcicqr58uvyz4iaOzEXP8jCIMcicRMib2au60ic8uD3Ym6op0QsoSvDgz8B8eEU3jsbXVkWII9CcQykv8aeB03Q/0?wx_fmt=gif"/>
    </div>
</head>
<body>
  <script>
    const imgs = Array.from(document.querySelectorAll('img[data-src]'))
    // 获取可视区域的高度
    const viewHight = window.innerHeight;

    function lazyload () {
      if (imgs.length === 0) {
        return
      }
      for (let i = 0; i < imgs.length; i++) {
        const el = imgs[i]
        // 获取当前元素顶部距离可视区域顶部的距离
        const { top } = el.getBoundingClientRect()
        // getBoundingClientRect返回的top是动态变化的
        // 因此只需比较可视区域的高度即可判断图片是否在可视区域内
        if (top < viewHight) {
          el.src = el.getAttribute('data-src')
          el.removeAttribute('data-src')
          // 当前图片加载了，就剔除
          imgs.splice(i, 1)
          i--
        }
      }
    }

    // 加个节流
    window.addEventListener("scroll", lazyload);

    lazyload();
  </script>
</body>
</html>
```

方案3：[IntersectionObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver)

>`IntersectionObserver`接口提供了一种异步观察目标元素与其祖先元素或顶级文档视口（`viewport`）交叉状态的方法。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
    <div style="height: 2000px;"></div>
    <div>
      <img data-src="http://mmbiz.qpic.cn/sz_mmbiz_gif/6a4WXcicqr58uvyz4iaOzEXP8jCIMcicRMib2au60ic8uD3Ym6op0QsoSvDgz8B8eEU3jsbXVkWII9CcQykv8aeB03Q/0?wx_fmt=gif"/>
    </div>
</head>
<body>
  <script>
    const imgs = document.querySelectorAll('img[data-src]')

    // 当元素可见比例超过指定阈值后，会调用一个回调函数，此回调函数接受两个参数
    // entries: 一个IntersectionObserverEntry对象的数组，每个被触发的阈值
    // observer: 被调用的IntersectionObserver实例
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        // 如果目标元素与交叉区域观察者对象 (intersection observer) 的根相交，则返回 true .如果返回 true
        if (entry.isIntersecting) {
          // 获取目标元素
          const el = entry.target
          const src = el.getAttribute('data-src')
          if (src) {
            el.src = src
            el.removeAttribute('data-src')
          }
          // 解除观察
          observer.unobserve(el)
        }
      })
    }, {
      // 规定了一个监听目标与边界盒交叉区域的比例值
      // 若指定值为 0.0，则意味着监听元素即使与根有 1 像素交叉，此元素也会被视为可见
      // 若指定值为 1.0，则意味着整个元素都在可见范围内时才算可见
      threshold: [0],
    })

    imgs.forEach((image) => {
      // 监听每个图片
      observer.observe(image)
    })
  </script>
</body>
</html>
```
