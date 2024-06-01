/**
 * 主窗口模块，负责创建和管理应用程序的主要窗口。
 * 使用Electron框架，配置窗口属性，并处理窗口事件。
 */

const { BrowserWindow, ipcMain } = require('electron') // 引入Electron的BrowserWindow和ipcMain模块
const path = require('path') // 引入Node.js的path模块

// 判断是否为开发环境
const isDevelopment = process.env.NODE_ENV === 'development'
let mainWindow = null // 全局变量，用于存储主窗口对象

/**
 * 创建并配置主窗口。
 * 根据环境加载不同的资源，并设置窗口属性。
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1160, // 窗口宽度
    height: 752, // 窗口高度
    minHeight: 632, // 窗口最小高度
    minWidth: 960, // 窗口最小宽度
    show: false, // 初始时不显示窗口
    frame: false, // 窗口不显示传统边框和标题栏
    title: 'Harbour', // 窗口标题
    webPreferences: {
      // Web偏好设置
      nodeIntegration: true, // 启用Node.js集成
      preload: path.resolve(__dirname, '../utils/contextBridge.js') // 预加载脚本路径
    },
    icon: path.resolve(__dirname, '../assets/logo.png') // 窗口图标路径
  })

  // 根据环境加载不同的页面
  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:8080/')
  } else {
    const entryPath = path.resolve(__dirname, '../../build/index.html')
    mainWindow.loadFile(entryPath)
  }

  // 等待窗口准备显示时显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 初始化窗口事件监听
  mainWindowListenEvents()
}
/**
 * 监听主窗口的事件，包括最小化、最大化、恢复、关闭和打开开发者工具。
 * 该函数不接受参数，也不返回任何值。
 */
function mainWindowListenEvents() {
  // 监听主窗口最小化事件
  ipcMain.on('mainWindow-min', () => {
    mainWindowIsExist() && mainWindow.minimize()
  })

  // 监听主窗口最大化事件，同时向窗口发送最大化状态
  ipcMain.on('mainWindow-max', () => {
    if (mainWindowIsExist()) {
      mainWindow.maximize()
      mainWindow.webContents.send('mainWindowIsMax', true)
    }
  })

  // 监听主窗口恢复事件，同时向窗口发送恢复状态
  ipcMain.on('mainWindow-restore', () => {
    if (mainWindowIsExist()) {
      mainWindow.unmaximize()
      mainWindow.webContents.send('mainWindowIsMax', false)
    }
  })

  // 监听主窗口关闭事件，实际操作为隐藏窗口
  ipcMain.on('mainWindow-close', () => {
    mainWindowIsExist() && mainWindow.hide()
  })

  // 监听打开开发者工具事件
  ipcMain.on('mainWindow-open-devtool', () => {
    mainWindowIsExist() && mainWindow.webContents.openDevTools()
  })
}

/**
 * 检查主窗口是否存在且未被销毁。
 * @returns {boolean} 如果主窗口存在且未被销毁，则返回true；否则返回false。
 */
function mainWindowIsExist() {
  return mainWindow && !mainWindow.isDestroyed()
}

/**
 * 获取主窗口对象。
 * @returns {BrowserWindow|null} 返回主窗口对象，如果主窗口不存在则返回null。
 */
function getMainWindow() {
  return mainWindow
}

// 导出模块方法
module.exports = {
  getMainWindow,
  createMainWindow,
  mainWindowIsExist
}
