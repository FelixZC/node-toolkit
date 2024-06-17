import React, {
  ChangeEvent,
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useEffect,
  useRef
} from 'react'
import { Input, InputRef } from 'antd'
import '../../style/less/app.less'
import { getProcessNodeEnv, ipcRendererSend, isDesktop } from '@src/utils/desktop-utils'
import MineLayout from '@src/layout/index'

/**
 * 主应用组件
 * 本组件实现了根据环境不同打开开发者工具的功能，
 * 对于开发环境，支持使用Ctrl + F12直接打开开发者工具；
 * 对于生产环境，支持一种特殊的快捷键组合来激活一个输入框，并通过输入'openDevtool'来打开开发者工具。
 */
function App() {
  const openDevtoolInput = useRef<InputRef>(null)
  const isDevelopment = useRef(getProcessNodeEnv() === 'development')

  const openDevtool = useCallback(() => {
    ipcRendererSend('mainWindow-open-devtool')
  }, [])

  const openDevtoolInputChange: ChangeEventHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    if (value === 'openDevtool') {
      openDevtool()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { ctrlKey, metaKey, altKey, key } = e
      if (isDevelopment.current && ctrlKey && key === 'F12') {
        openDevtool()
      } else if (!isDevelopment.current && ctrlKey && metaKey && altKey && key === 'F12') {
        if (openDevtoolInput.current) {
          openDevtoolInput.current.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openDevtoolInput, isDevelopment])

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    event.target.value = ''
  }

  return (
    <div id="electron-app">
      {!isDevelopment.current && (
        <Input
          ref={openDevtoolInput}
          className="open-devtool-input"
          type="text"
          onChange={openDevtoolInputChange}
          onBlur={handleBlur} // 使用自定义的handleBlur函数清空输入框
        />
      )}
      {/* DesktopHeader 和其他组件的渲染逻辑 */}
      <div className={isDesktop() ? 'desktop-app-content' : 'app-content'}>
        <MineLayout />
      </div>
    </div>
  )
}

export default App
