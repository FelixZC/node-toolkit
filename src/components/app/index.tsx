import '../../style/less/app.less'
import React, { useEffect, useRef, useCallback, ChangeEvent } from 'react'
import DesktopHeader from '@src/components/desktop-header'
import { isDesktop, getProcessNodeEnv, ipcRendererSend } from '@src/utils/desktop-utils'
import MineLayout from '@src/layout/index'

/**
 * 主应用组件
 * 本组件实现了根据环境不同打开开发者工具的功能，
 * 对于开发环境，支持使用Ctrl + F12直接打开开发者工具；
 * 对于生产环境，支持一种特殊的快捷键组合来激活一个输入框，并通过输入'openDevtool'来打开开发者工具。
 */
function App() {
  // 用于引用打开开发者工具的输入框DOM元素
  const openDevtoolInput = useRef<HTMLInputElement>(null)
  // 用于判断当前是否是开发环境
  const isDevelopment = useRef(getProcessNodeEnv() === 'development')

  // 创建打开开发者工具的回调函数
  const openDevtool = useCallback(() => {
    ipcRendererSend('mainWindow-open-devtool')
  }, [])

  // 处理打开开发者工具输入框的值变化事件
  const openDevtoolInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    // 当输入框的值为'openDevtool'时，打开开发者工具
    if (value === 'openDevtool') {
      openDevtool()
    }
  }

  // 使用Effect监听键盘事件，实现快捷键打开开发者工具的功能
  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      const { ctrlKey, metaKey, altKey, key } = e
      // 开发环境使用ctrl + F12打开控制台
      if (isDevelopment.current && ctrlKey && key === 'F12') {
        openDevtool()
      }
      // 生产环境使用特定快捷键组合激活输入框
      if (!isDevelopment.current && ctrlKey && metaKey && altKey && key === 'F12') {
        if (openDevtoolInput.current) {
          openDevtoolInput.current.focus()
        }
      }
    })
  }, [openDevtool])

  // 渲染应用界面
  return (
    <div id="electron-app">
      {!isDevelopment.current && (
        // 在生产环境中，只有在特定快捷键组合触发下才会显示的输入框
        <input
          className="open-devtool-input"
          ref={openDevtoolInput}
          type="text"
          onChange={openDevtoolInputChange}
          onBlur={(e) => {
            e.target.value = ''
          }} // 失去焦点时清空输入框的值
        />
      )}
      {isDesktop() && <DesktopHeader />}
      {/* 如果是桌面环境，则渲染桌面头部组件 */}
      <div className={isDesktop() ? 'desktop-app-content' : 'app-content'}>
        {/*根据是否是桌面环境应用不同的样式类  */}
        <MineLayout />
      </div>
    </div>
  )
}

export default App
