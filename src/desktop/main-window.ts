/**
 * 主窗口模块，负责创建和管理应用程序的主要窗口。
 * 使用Electron框架，配置窗口属性，并处理窗口事件。
 */
import { BrowserWindow } from 'electron'
import mainWindowHandleEvents from './handle'
import mainWindowListenEvents from './listen'
import * as path from 'path'

// 判断是否为开发环境
type DevelopmentOrProduction = 'development' | 'production'
const isDevelopment: DevelopmentOrProduction = process.env.NODE_ENV! as DevelopmentOrProduction

let mainWindow: BrowserWindow | null = null // 全局变量，用于存储主窗口对象

/**
 * 创建并配置主窗口。
 * 根据环境加载不同的资源，并设置窗口属性。
 */
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1160,
    height: 752,
    minHeight: 632,
    minWidth: 960,
    show: false,
    frame: false,
    title: 'pzc tookit',
    webPreferences: {
      nodeIntegration: true,
      preload: path.resolve(__dirname, '../utils/context-bridge.js')
    },
    icon: path.resolve(__dirname, '../assets/images/logo.png')
  })

  if (isDevelopment === 'development') {
    mainWindow.loadURL('http://localhost:8888/home')
  } else {
    const entryPath = path.resolve(__dirname, 'public/index.html')
    mainWindow.loadFile(entryPath)
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show()
  })
  mainWindowListenEvents(mainWindow)
  mainWindowHandleEvents()
}

/**
 * 检查主窗口是否存在且未被销毁。
 * @returns {boolean} 如果主窗口存在且未被销毁，则返回true；否则返回false。
 */
function mainWindowIsExist(): boolean {
  return mainWindow !== null && !mainWindow.isDestroyed()
}

/**
 * 获取主窗口对象。
 * @returns {BrowserWindow | null} 返回主窗口对象，如果主窗口不存在则返回null。
 */
function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

// 导出模块方法
export { createMainWindow, getMainWindow, mainWindowIsExist }
