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
  const [windowIsMax, setWindowIsMax] = useState(false)

  useEffect(() => {
    const handleSetIsMax = (event: any, isMax: boolean) => {
      setWindowIsMax(isMax)
    }
    ipcRendererOn('mainWindowIsMax', handleSetIsMax)
    return () => {
      ipcRendererRemoveListener('mainWindowIsMax', handleSetIsMax)
    }
  }, [])

  const handleWindowOperation = (operation: 'min' | 'max' | 'restore' | 'close') => {
    ipcRendererSend(`mainWindow-${operation}`)
  }

  return (
    <div className="desktop-header">
      <div className="header-logo-box">
        <img src={logoImage} alt="pzc tookit" />
        <span>pzc tookit</span>
      </div>
      <div className="header-handle-box">
        <div className="handle-icon-box" onClick={() => handleWindowOperation('min')}>
          <SvgIcon svgName="min-icon" needPointer iconColor="#737780" iconSize={24} />
        </div>
        {windowIsMax ? (
          <div className="handle-icon-box" onClick={() => handleWindowOperation('restore')}>
            <SvgIcon svgName="restore-icon" needPointer iconColor="#737780" iconSize={24} />
          </div>
        ) : (
          <div className="handle-icon-box" onClick={() => handleWindowOperation('max')}>
            <SvgIcon svgName="max-icon" needPointer iconColor="#737780" iconSize={24} />
          </div>
        )}
        <div
          className="handle-icon-box handle-close-icon"
          onClick={() => handleWindowOperation('close')}
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
