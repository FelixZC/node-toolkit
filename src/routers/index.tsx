import { Layout } from 'antd'
import Loading from '@src/components/loading'
import { Navigate } from 'react-router-dom'
import React, { lazy, Suspense } from 'react'
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
const ExecPostcss = lazy(() => import('@src/components/exec/exec-postcss'))
const ExecPosthtml = lazy(() => import('@src/components/exec/exec-posthtml'))
const ExecFileStatistical = lazy(() => import('@src/components/exec/exec-file-statistical'))
const ExecRegQueryBatch = lazy(() => import('@src/components/exec/exec-reg-query-batch'))
const ExecGetAttrsAndAnnotation = lazy(
  () => import('@src/components/exec/exec-get-attrs-and-annotation')
)
const ExecModifyFile = lazy(() => import('@src/components/exec/exec-modify-file-names-batch'))
const Exception403 = lazy(() => import('@src/components/exception/exception403'))
const NoMatch = lazy(() => import('@src/components/no-match'))
// 路由配置
const rootRouter: RouteObject[] = [
  {
    path: '/',
    index: false,
    name: '',
    key: '/redirect',
    element: <Navigate replace to="/home" />
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
  },
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
        name: 'ExecBabel',
        key: '/exec/ExecBabel',
        auth: true,
        element: lazyLoad(ExecBabel)
      },
      {
        index: true,
        path: '/exec/ExecJscodemod',
        name: 'ExecJscodemod',
        key: '/exec/ExecJscodemod',
        auth: true,
        element: lazyLoad(ExecJscodemod)
      },
      {
        index: true,
        path: '/exec/ExecPostcss',
        name: 'ExecPostcss',
        key: '/exec/ExecPostcss',
        auth: true,
        element: lazyLoad(ExecPostcss)
      },
      {
        index: true,
        path: '/exec/ExecPosthtml',
        name: 'ExecPosthtml',
        key: '/exec/ExecPosthtml',
        auth: true,
        element: lazyLoad(ExecPosthtml)
      },
      {
        index: true,
        path: '/exec/ExecFileStatistical',
        name: 'ExecFileStatistical',
        key: '/exec/ExecFileStatistical',
        auth: true,
        element: lazyLoad(ExecFileStatistical)
      },
      {
        index: true,
        path: '/exec/ExecGetAttrsAndAnnotation',
        name: 'ExecGetAttrsAndAnnotation',
        key: '/exec/ExecGetAttrsAndAnnotation',
        auth: true,
        element: lazyLoad(ExecGetAttrsAndAnnotation)
      },
      {
        index: true,
        path: '/exec/ExecRegQueryBatch',
        name: 'ExecRegQueryBatch',
        key: '/exec/ExecRegQueryBatch',
        auth: true,
        element: lazyLoad(ExecRegQueryBatch)
      },
      {
        index: true,
        path: '/exec/ExecModifyFile',
        name: 'ExecModifyFile',
        key: '/exec/ExecModifyFile',
        auth: true,
        element: lazyLoad(ExecModifyFile)
      }
    ]
  }
]
export default rootRouter
