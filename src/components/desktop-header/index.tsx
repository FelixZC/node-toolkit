import '../../style/less/desktop-header.less'
import React, { memo, useState, useEffect } from 'react'
import SvgIcon from '@src/components/svg-icon'
import { ipcRendererSend, ipcRendererOn, ipcRendererRemoveListener } from '@src/utils/desktop-utils'
import logoImage from '@assets/images/logo.png'

/**
 * DesktopHeader组件用于渲染桌面头部栏。
 * 该组件通过ipcRenderer与主进程进行通信，获取和设置窗口最大化状态，并提供窗口最小化、最大化和关闭功能。
 */
function DesktopHeader() {
  // 使用state来追踪窗口是否被最大化
  const [windowIsMax, setWindowIsMax] = useState(false)

  // 使用useEffect来监听主进程发送的窗口最大化状态更新事件，并更新state
  useEffect(() => {
    const handleSetIsMax = (event: any, isMax: boolean) => {
      setWindowIsMax(isMax)
    }
    ipcRendererOn('mainWindowIsMax', handleSetIsMax)
    // 组件卸载时移除事件监听器
    return () => {
      ipcRendererRemoveListener('mainWindowIsMax', handleSetIsMax)
    }
  }, [])

  // 发送指令给主进程以执行窗口操作（最小化、最大化、关闭）
  const handleWindow = (eventName: string) => {
    ipcRendererSend(`mainWindow-${eventName}`)
  }

  // 渲染桌面头部栏组件
  return (
    <div className="desktop-header">
      <div className="header-logo-box">
        <img src={logoImage} alt="" />
        <span>Harbour</span> {/* 渲染应用名称 */}
      </div>
      <div className="header-handle-box">
        {/* 窗口最小化按钮 */}
        <div className="handle-icon-box" onClick={handleWindow.bind(this, 'min')}>
          <SvgIcon svgName="min-icon" needPointer iconColor="#737780" iconSize={24} />
        </div>
        {/* 根据窗口是否最大化，显示不同的按钮（最大化恢复或最大化） */}
        {windowIsMax ? (
          <div className="handle-icon-box" onClick={handleWindow.bind(this, 'restore')}>
            <SvgIcon svgName="restore-icon" needPointer iconColor="#737780" iconSize={24} />
          </div>
        ) : (
          <div className="handle-icon-box" onClick={handleWindow.bind(this, 'max')}>
            <SvgIcon svgName="max-icon" needPointer iconColor="#737780" iconSize={24} />
          </div>
        )}
        {/* 窗口关闭按钮 */}
        <div
          className="handle-icon-box handle-close-icon"
          onClick={handleWindow.bind(this, 'close')}
        >
          <SvgIcon
            svgName="close-icon"
            needPointer
            hasHover
            iconColor="#737780"
            hoverColor="#fff"
            iconSize={24}
          />
        </div>
      </div>
    </div>
  )
}

export default memo(DesktopHeader)
