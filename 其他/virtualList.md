## 虚拟列表

>虚拟列表指的就是「可视区域渲染」的列表，是对长列表的一种优化方案，它只对可视区域进行渲染，对非可视区域不渲染或部分渲染。

虚拟列表的组成一般包含3个部分：

- 可视区：滚动容器元素的视觉可见区域。

- 列表渲染区：渲染列表元素的区域，列表渲染区大于（增加缓冲区）等于可视区

- 真实列表区：滚动容器元素的内部内容区域（撑起滚动条）

### 元素固定高度的虚拟列表

实现虚拟列表就是在处理用户滚动时，改变列表在可视区域的渲染部分，其具体步骤如下：

- 计算可视区的`startIndex`和`endIndex`

- 根据`startIndex`和`endIndex`渲染数据

- 计算`startOffset`偏移量并设置到列表渲染区上

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VirtualList</title>
  <style>
    .scroll-box {
      position: relative;
      width: 500px;
      overflow: auto;
      border: 1px solid rgb(0, 0, 0);
    }

    .scroll-data {
      position: absolute;
      top: 0;
      width: 100%;
    }

    .scroll-item {
      height: 20px;
    }

    .scroll-item:hover {
      background: green;
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- 可视区，高度 = 需要显示的元素个数 * 单个定高元素高度 -->
    <div
      class="scroll-box"
      :style="`height: ${viewCount * itemHeight}px;`"
      @scroll="scrollHandle"
    >
      <!-- 真实列表区（撑起滚动条），高度 = 列表长度 * 单个定高元素高度 -->
      <div
        class="scroll-blank"
        :style="`height: ${data.length * itemHeight}px;`"
      ></div>
      <!-- 列表渲染区 -->
      <div class="scroll-data" :style="`transform: translateY(${positionTop}px);`">
        <div
          v-for="(item, index) in renderList"
          :key="index"
          class="scroll-item"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </div>
  <script src="https://unpkg.com/vue@3.2.27/dist/vue.global.js"></script>
  <script>
    const { computed, ref } = Vue

    // 模拟数据
    const mock = (length) => {
      return Object.keys(new Array(length).fill(''))
    }
    const data = mock(1000)

    const App = {
      setup() {
        // 可视区元素数量
        const viewCount = 20
        // 可视区第一个元素的top偏移量
        const positionTop = ref(0)
        // 每个元素高度
        const itemHeight = 20
        // 可视区第一个元素索引，最后一个元素索引为startIndex + viewCount
        const startIndex = ref(0)

        // 滚动时计算可视区的startIndex
        const scrollHandle = (e) => {
          const { scrollTop } = event.currentTarget
          startIndex.value = Math.floor(scrollTop / itemHeight)
          positionTop.value = scrollTop
        }

        // 实际渲染的列表
        const renderList = computed(() => {
          return data.slice(startIndex.value, startIndex.value + viewCount)
        })

        return {
          data,
          viewCount,
          scrollHandle,
          renderList,
          itemHeight,
          positionTop,
        }
      },
    }
    const app = Vue.createApp(App)
    app.mount('#app')
  </script>
</body>
</html>
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/vue@3.2.27/dist/vue.global.js"></script>
  <title>VirtualList</title>
  <style>
    .scroll-box {
      position: relative;
      width: 500px;
      overflow: auto;
      border: 1px solid rgb(0, 0, 0);
    }

    .scroll-data {
      position: absolute;
      top: 0;
      width: 100%;
    }

    .scroll-item {
      height: 20px;
    }

    .scroll-item:hover {
      background: green;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7.10.3/babel.min.js" crossorigin></script>
  <script type="text/babel" data-presets="react,stage-3">
    const { useState } = React
    const { flushSync } = ReactDOM
    // 模拟数据
    const mock = (length) => {
      return Object.keys(new Array(length).fill(''))
    }
    const data = mock(1000)

    const FixedSizeList = () => {
      // 可视区元素数量
      const viewCount = 20
      // 每个元素高度
      const itemHeight = 20
      // 记录滚动的高度
      const [positionTop, setPositionTop] = useState(0)
      const startIndex = Math.floor(positionTop / itemHeight)
      
      // 实际渲染的列表
      const renderList = () => {
        return data.slice(startIndex, startIndex + viewCount).map(v => {
          return (
            <div className="scroll-item" key={v}>{ v }</div>
          )
        })
      }
      
      return (
        // 可视区，高度 = 需要显示的元素个数 * 单个定高元素高度
        <div
          className="scroll-box"
          style={{
            height: `${itemHeight * viewCount}px`
          }}
          onScroll={(e) => {
            flushSync(() => {
              setPositionTop(e.target.scrollTop);
            });
          }}>

          {/* 真实列表区（撑起滚动条），高度 = 列表长度 * 单个定高元素高度 */}
          <div
            className="scroll-blank"
            style={{
              height: `${data.length * itemHeight}px`
            }}
          ></div>

          {/* 列表渲染区 */}
          <div
            className="scroll-data"
            style={{
              transform: `translateY(${positionTop}px)`
            }}>
            {renderList()}
          </div>
        </div>
      );
    };
    const root = ReactDOM.createRoot(document.getElementById("app"))
    root.render(<FixedSizeList />);
  </script>
  
</body>
</html>
```

### 元素不定高度的虚拟列表

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VirtualList</title>
  <style>
    .scroll-box {
      position: relative;
      width: 500px;
      height: 50vh;
      overflow: auto;
      border: 1px solid rgb(0, 0, 0);
    }

    .scroll-data {
      position: absolute;
      top: 0;
      width: 100%;
    }

    .scroll-item:hover {
      background: green;
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- 可视区 -->
    <div
      class="scroll-box"
      @scroll="scrollHandle"
    >
      <!-- 真实列表区（撑起滚动条 -->
      <div
        class="scroll-blank"
        :style="`height: ${phantomHeight}px;`"
      ></div>
      <!-- 列表渲染区 -->
      <div class="scroll-data" :style="`transform: translateY(${positionTop}px);`">
        <div
          v-for="item in renderList"
          ref="nodes"
          :key="item.id"
          :id="item.id"
          class="scroll-item"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.bootcss.com/Faker/3.1.0/faker.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vue@3.3.8/dist/vue.global.min.js"></script>
  <script type="module">
    const { computed, ref, onMounted, onUpdated, nextTick } = Vue

    // 模拟数据源
    const data = [];
    for (let id = 0; id < 1000; id++) {
      data.push({
        id,
        value: faker.lorem.sentences() // 长文本
      })
    }

    const App = {
      setup() {
        // 预估每个元素高度
        const estimated = 100
        // 记录每个元素的高度和底部距离窗口顶部的距离
        const positions = []
        // 可视区元素数量，先写死（可以通过传入height / estimated计算得出）
        const viewCount = 10
        // 可视区第一个元素索引
        const startIndex = ref(0)
        // 可视区第一个元素距离窗口顶部的距离
        const positionTop = ref(0)

        const nodes = ref([])
        // 占位高度
        const phantomHeight = ref(data.length * estimated)

        // 渲染的列表项
        const renderList = computed(() => {
          return data.slice(startIndex.value, startIndex.value + viewCount)
        })

        // 二分法查找
        const binarySearch = (list, value) => {
          let start = 0
          let end = list.length - 1
          let index = null
          while (start <= end) {
            const midIndex = parseInt((start + end) / 2)
            const midValue = list[midIndex].bottom
            if (midValue === value) {
              return midIndex + 1
            } else if (midValue < value) {
              start = midIndex + 1
            } else if (midValue > value) {
              if (index === null || index > midIndex) {
                index = midIndex
              }
              end = end - 1
            }
          }
          return index
        }

        // 获取可视区域第一个元素的索引
        const getStartIndex = (scrollTop = 0) => {
          return binarySearch(positions, scrollTop)
        }

        // 设置可视区第一个元素的top偏移量
        const setPositionTop = () => {
          if (startIndex.value >= 1) {
            positionTop.value = positions[startIndex.value - 1].bottom
          } else {
            positionTop.value = 0
          }
        }

        // 获取列表项的当前尺寸
        const updateItemsSize = () => {
          nodes.value.forEach(node => {
            // 获取元素的高度
            const { height } = node.getBoundingClientRect()
            // 在数据源中的索引
            const index = Number(node.id)
            // 旧的高度
            const oldHeight = positions[index].height
            // 高度差值
            const diff = oldHeight - height

            if (diff) {
              positions[index].bottom = positions[index].bottom - diff
              positions[index].height = height

              // 向下更新
              for (let i = index + 1; i < positions.length; i++) {
                positions[i].bottom = positions[i].bottom - diff
              }
            }
          })
        }

        const scrollHandle = (e) => {
          const { scrollTop } = e.currentTarget
          startIndex.value = getStartIndex(scrollTop)
          setPositionTop()
        }

        const setPhantomHeight = () => {
          phantomHeight.value = positions[positions.length - 1].bottom
        }

        
        onMounted(() => {
          data.forEach((cur, idx) => {
            positions[positions.length] = {
              // 元素高度
              height: estimated,
              // 元素底部距离窗口顶部的距离
              bottom: (idx + 1) * estimated
            }
          })
        })

        onUpdated(() => {
          nextTick(() => {
            if (nodes.value.length === 0) return
            // 获取真实元素高度信息，修改对应的positions缓存
            updateItemsSize()
            // 更新偏移量
            setPositionTop()
            // 更新占位高度
            setPhantomHeight()
          })
        })

        return {
          nodes,
          phantomHeight,
          positionTop,
          renderList,
          scrollHandle
        }
      }
    }

    const app = Vue.createApp(App)
    app.mount('#app')
  </script>
</body>
</html>
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/vue@3.2.27/dist/vue.global.js"></script>
  <title>VirtualList</title>
  <style>
    .scroll-box {
      position: relative;
      width: 500px;
      height: 50vh;
      overflow: auto;
      border: 1px solid rgb(0, 0, 0);
    }

    .scroll-data {
      position: absolute;
      top: 0;
      width: 100%;
    }

    .scroll-item:hover {
      background: green;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.bootcss.com/Faker/3.1.0/faker.min.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7.10.3/babel.min.js" crossorigin></script>
  <script type="text/babel" data-presets="react,stage-3">
    const { useState, useEffect, useMemo, useRef } = React
    const { flushSync } = ReactDOM

    // 模拟数据源
    const data = [];
    for (let id = 0; id < 1000; id++) {
      data.push({
        id,
        value: faker.lorem.sentences() // 长文本
      })
    }

    // 二分法查找
    const binarySearch = (list, value) => {
      let start = 0
      let end = list.length - 1
      let index = null
      while (start <= end) {
        const midIndex = parseInt((start + end) / 2)
        const midValue = list[midIndex].bottom
        if (midValue === value) {
          return midIndex + 1
        } else if (midValue < value) {
          start = midIndex + 1
        } else if (midValue > value) {
          if (index === null || index > midIndex) {
            index = midIndex
          }
          end = end - 1
        }
      }
      return index
    }

    const Item = ({ id, value, updateItemsSize }) => {
      const itemRef = useRef()
      useEffect(() => {
        if (itemRef.current) {
          updateItemsSize(id, itemRef.current.getBoundingClientRect().height)
        }
      }, [updateItemsSize, id])

      return (
        <div className="scroll-item" ref={itemRef}>
          {id}-{value}
        </div>
      )
    }

    const DynamicList = () => {
      // 可视区元素数量
      const viewCount = 10
      // 预估每个元素高度
      const estimatedHeight = 100
      // 记录滚动的高度
      const [positionTop, setPositionTop] = useState(0)
      
      // 记录列表项的位置信息
      const positions = useMemo(() => data.map((item, index) => {
        return {
          // 元素高度
          height: estimatedHeight,
          // 元素底部距离窗口顶部的距离
          bottom: (index + 1) * estimatedHeight
        };
      }), [])

      // 获取可视区域第一个元素的索引
      const getStartIndex = (scrollTop = 0) => {
        return binarySearch(positions, scrollTop)
      }

      // 可视区第一个元素索引
      const startIndex = getStartIndex(positionTop)
      // 占位高度
      const phantomHeight = positions[positions.length - 1].bottom
      
      // 可视区第一个元素索引，最后一个元素索引为startIndex + viewCount
      const scrollHandle = (scrollTop) => {
        const startIndex = getStartIndex(scrollTop)
        // 设置可视区第一个元素的top偏移量
        setPositionTop(startIndex >= 1 ? positions[startIndex - 1].bottom : 0)
      }

      // 获取列表项的当前尺寸
      const updateItemsSize = (index, height = estimatedHeight) => {
        // 旧的高度
        const oldHeight = positions[index].height
        // 高度差值
        const diff = oldHeight - height
        if (diff) {
          positions[index].bottom = positions[index].bottom - diff
          positions[index].height = height
          // 向下更新
          for (let i = index + 1; i < positions.length; i++) {
            positions[i].bottom = positions[i].bottom - diff
          }
        }
      }

      // 实际渲染的列表
      const renderList = () => {
        return data.slice(startIndex, startIndex + viewCount).map(v => {
          return (
            <Item
              key={v.id}
              value={v.value}
              id={v.id}
              updateItemsSize={updateItemsSize}/>
          )
        })
      }

      return (
        // 可视区
        <div
          className="scroll-box"
          onScroll={e => {
            flushSync(() => {
              scrollHandle(e.currentTarget.scrollTop)
            })
          }}>

          {/* 真实列表区（撑起滚动条） */}
          <div
            className="scroll-blank"
            style={{
              height: `${phantomHeight}px`
            }}
          ></div>

          {/* 列表渲染区 */}
          <div
            className="scroll-data"
            style={{
              transform: `translateY(${positionTop}px)`
            }}>
            {renderList()}
          </div>
        </div>
      );
    };
    const root = ReactDOM.createRoot(document.getElementById("app"))
    root.render(<DynamicList />);
  </script>
  
</body>
</html>
```


### 优化点

- 增加缓冲区，在可视区外设置缓存区，额外渲染合适的列表项。当滚动过快时，会先显示缓存区中的元素，减少白屏出现的情况。

- 增加加载状态，采用`skeleton`加载骨架屏来代替原有的不渲染部分。

- 对于元素动态高度的场景，可以监听元素的高度变化（如`ResizeObserver`）重新计算各种数据。
