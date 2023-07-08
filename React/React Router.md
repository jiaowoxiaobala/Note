[React Router](https://reactrouter.com/en/main)

React Router笔记（V6版本

<!-- ## Route

>`Route`是传递给路由器创建函数的对象。

```ts
const router = creatBrowserRouter([

  // 需要渲染的路由组件
  element: <Team/>,

  // 匹配的路由地址
  path: 'teams/:teamId',

  // 在渲染前的数据请求
  loader: async ({ request, params }) => {
    return fetch(
      `/fake/api/teams/${params.teamId}.json`,
      { signal: request.signal }
    );
  },
])
``` -->

## Components



## Hooks

### useRoutes

>`useRoutes Hook`在功能上等效于`<Routes>`，但它使用`JavaScript对象`而不是`<Route>`元素来定义路由，这些对象和普通`<Route>`元素有相同的属性。


```tsx
import { useRoutes } from "react-router-dom";

function App() {
  // useRoutes要么返回可用于渲染路由树的有效 React 元素，要么返回null
  let element = useRoutes([
    {
      path: "/",
      element: <Dashboard />,
      children: [
        {
          path: "messages",
          element: <DashboardMessages />,
        },
        { path: "tasks", element: <DashboardTasks /> },
      ],
    },
    { path: "team", element: <AboutPage /> },
  ]);

  return element;
}


// 换成Routes和Route的方式
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path='/' element={<Dashboard/>}>
        {/* 嵌套路由 */}
        <Route path='messages' element={<DashboardMessages />} />
        <Route path='tasks' element={<DashboardTasks />} />
      </Route>
      <Route path='team' element={<AboutPage />}></Route>
    </Routes>
  )
}
```

### useOutlet

>用于在父路由中呈现匹配的子路由。

```tsx
import { useRoutes } from 'react-router-dom'
function App() {
  let element = useRoutes([
    {
      path: "/",
      element: <Dashboard />,
      children: [
        {
          path: "messages",
          element: <DashboardMessages />,
        },
      ],
    },
  ]);

  return element;
}

// Dashboard组件
import { useOutlet, Outlet } from 'react-router-dom'

function Dashboard() {
  return (
    <div>
      {/* 这里呈现匹配的子路由，相等于vue-router中的router-view */}
      { useOutlet() }

      {/* 也可以通过组件的形式 */}
      <OutLet/>
    </div>
  )
}
```