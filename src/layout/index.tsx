// 引入 useNavigate 钩子
import { Layout, Menu } from 'antd'
import React from 'react'
import rootRouter from '@src/routers'
import { Route, Routes, useNavigate } from 'react-router-dom'
import type { RouteObject } from '@src/routers'
const { Content, Sider } = Layout
function filterMenuItems(routes: RouteObject[]) {
  return routes
    .filter((route) => route.index)
    .map((route) => {
      const item = {
        label: route.name,
        ...route
      }
      if (route.children) {
        item.children = filterMenuItems(route.children) // 递归调用以处理子路由
      }
      return item
    })
}
const menuItems = filterMenuItems(rootRouter)
const rootRouterFlattenArray = rootRouter.reduce((acc: RouteObject[], cur) => {
  acc.push(cur)
  if (cur.children) {
    acc.push(...cur.children)
  }
  return acc
}, [])
const Lay: React.FC = () => {
  const navigate = useNavigate() // 初始化 useNavigate 钩子
  const onMenuItemClick = (item: { key: string }) => {
    // 根据菜单项的 key 导航到对应的路由
    const targetRoute = rootRouterFlattenArray.find((route) => route.key === item.key)
    if (targetRoute) {
      navigate(targetRoute.path)
    }
  }
  return (
    <Layout
      style={{
        minHeight: '100vh'
      }}
    >
      <Sider width={200}>
        <Menu
          mode="inline"
          defaultSelectedKeys={['/']}
          defaultOpenKeys={['/']}
          style={{
            height: '100%',
            borderRight: 0
          }}
          items={menuItems}
          onClick={onMenuItemClick}
        />
      </Sider>
      <Layout>
        <Content>
          <Routes>
            {rootRouterFlattenArray.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}
export default Lay
