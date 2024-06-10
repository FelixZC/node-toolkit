import React from 'react'
import { Provider } from 'react-redux'
import store from '@src/store'
import ReactDOM from 'react-dom/client'
import App from '../components/app'
import { HashRouter as Router } from 'react-router-dom' // 引入 useNavigate 钩子
import '../utils/svg-icons'
// 主进程代码 (main.js 或者 index.js)

const rootElement = document.getElementById('root') as HTMLElement
const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  </React.StrictMode>
)
