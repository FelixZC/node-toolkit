import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../components/app'
import { BrowserRouter as Router } from 'react-router-dom' // 引入 useNavigate 钩子
import '../utils/svg-icons'
// 主进程代码 (main.js 或者 index.js)

const rootElement = document.getElementById('root') as HTMLElement
const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
)
