import { Layout } from 'antd'
import Loading from '@src/components/antd-wrap/loading'
import { Navigate } from 'react-router-dom'
import React, { lazy, Suspense } from 'react'
export interface RouteObject {
  path: string
  name: string
  i18nKey?: string
  key: string
  auth?: boolean
  element: JSX.Element
  show: boolean
  children?: RouteObject[]
}
const lazyLoad = (Component: React.ComponentType) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
)
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
const FileManager = lazy(() => import('@src/components/file-manage'))
const Exception403 = lazy(() => import('@src/components/exception/exception403'))
const NoMatch = lazy(() => import('@src/components/no-match'))
const rootRouter: RouteObject[] = [
  {
    path: '/',
    show: false,
    name: '',
    key: '/Redirect',
    element: <Navigate replace to="/Home" />
  },
  {
    show: false,
    path: '/403',
    name: '403',
    key: '/403',
    auth: false,
    element: lazyLoad(Exception403)
  },
  {
    show: false,
    path: '*',
    name: 'No Match',
    key: '*',
    element: lazyLoad(NoMatch)
  },
  {
    show: true,
    path: '/Home',
    name: '首页',
    key: '/Home',
    auth: true,
    element: lazyLoad(HomePage)
  },
  {
    show: true,
    path: '/Exec',
    name: '执行器',
    key: '/Exec',
    auth: true,
    element: lazyLoad(Layout),
    children: [
      {
        show: true,
        path: '/Exec/ExecBabel',
        name: 'ExecBabel',
        key: '/Exec/ExecBabel',
        auth: true,
        element: lazyLoad(ExecBabel)
      },
      {
        show: true,
        path: '/Exec/ExecJscodemod',
        name: 'ExecJscodemod',
        key: '/Exec/ExecJscodemod',
        auth: true,
        element: lazyLoad(ExecJscodemod)
      },
      {
        show: true,
        path: '/Exec/ExecPostcss',
        name: 'ExecPostcss',
        key: '/Exec/ExecPostcss',
        auth: true,
        element: lazyLoad(ExecPostcss)
      },
      {
        show: true,
        path: '/Exec/ExecPosthtml',
        name: 'ExecPosthtml',
        key: '/Exec/ExecPosthtml',
        auth: true,
        element: lazyLoad(ExecPosthtml)
      },
      {
        show: true,
        path: '/Exec/ExecFileStatistical',
        name: 'ExecFileStatistical',
        key: '/Exec/ExecFileStatistical',
        auth: true,
        element: lazyLoad(ExecFileStatistical)
      },
      {
        show: true,
        path: '/Exec/ExecGetAttrsAndAnnotation',
        name: 'ExecGetAttrsAndAnnotation',
        key: '/Exec/ExecGetAttrsAndAnnotation',
        auth: true,
        element: lazyLoad(ExecGetAttrsAndAnnotation)
      },
      {
        show: true,
        path: '/Exec/ExecRegQueryBatch',
        name: 'ExecRegQueryBatch',
        key: '/Exec/ExecRegQueryBatch',
        auth: true,
        element: lazyLoad(ExecRegQueryBatch)
      },
      {
        show: true,
        path: '/Exec/ExecModifyFile',
        name: 'ExecModifyFile',
        key: '/Exec/ExecModifyFile',
        auth: true,
        element: lazyLoad(ExecModifyFile)
      }
    ]
  },
  {
    show: true,
    path: '/FileManage',
    name: '文件查询',
    key: '/FileManage',
    auth: true,
    element: lazyLoad(FileManager)
  }
]
export default rootRouter
