import React from 'react'
import '@src/style/less/home-page.less' // 确保导入CSS文件

const HomePage: React.FC = () => {
  return (
    <div className="home-container">
      <h1 className="welcome-title">欢迎来到首页，暂时空空如也</h1>
    </div>
  )
}

export default HomePage
