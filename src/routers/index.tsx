import React, { Suspense, lazy } from 'react'
import Loading from '@src/components/loading'
import { Layout } from 'antd'

export interface RouteObject {
  path: string
  name: string
  i18nKey?: string
  key: string
  auth?: boolean
  element: JSX.Element
  index?: boolean
  children?: RouteObject[]
}

// 使用Suspense和lazy加载指定的组件
const lazyLoad = (Component: React.ComponentType) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
)

// 以下组件懒加载定义
const HomePage = lazy(() => import('@src/components/home-page'))
const ExecBabel = lazy(() => import('@src/components/exec/exec-babel'))
const ExecJscodemod = lazy(() => import('@src/components/exec/exec-jscodemod'))
const Exception403 = lazy(() => import('@src/components/exception/exception403'))
const NoMatch = lazy(() => import('@src/components/no-match'))
// 路由配置
const rootRouter: RouteObject[] = [
  {
    index: true,
    path: '/home',
    name: '首页',
    key: '/home',
    auth: true,
    element: lazyLoad(HomePage)
  },
  {
    index: true,
    path: '/exec',
    name: '执行器',
    key: '/exec',
    auth: true,
    element: lazyLoad(Layout),
    children: [
      {
        index: true,
        path: '/exec/ExecBabel',
        name: 'babel',
        key: '/exec/ExecBabel',
        auth: true,
        element: lazyLoad(ExecBabel)
      },
      {
        index: true,
        path: '/exec/ExecJscodemod',
        name: 'jscodemod',
        key: '/exec/ExecJscodemod',
        auth: true,
        element: lazyLoad(ExecJscodemod)
      }
    ]
  },
  {
    index: false,
    path: '/403',
    name: '403',
    key: '/403',
    auth: false,
    element: lazyLoad(Exception403)
  },
  {
    index: false,
    path: '*',
    name: 'No Match',
    key: '*',
    element: lazyLoad(NoMatch)
  }
]

export default rootRouter
