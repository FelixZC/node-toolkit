/*
 * 引入Electron和Node.js模块
 */
const { app, Tray, Menu } = require('electron')
const path = require('path')
/*
 * 引入自定义的窗口管理器模块
 */
const { getMainWindow, mainWindowIsExist } = require('./mainWindow')

// 全局Tray实例变量
let tray = null
/*
 * 定义Tray图标的路径
 */
const iconPath = path.resolve(__dirname, '../assets/images/logo.png')

/*
 * 初始化Tray菜单
 */
function initTray() {
  // 创建Tray实例
  tray = new Tray(iconPath)

  // 构建上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开应用',
      click: () => {
        // 如果主窗口存在，则显示主窗口
        mainWindowIsExist() && getMainWindow().show()
      }
    },
    {
      label: '退出应用',
      click: () => {
        // 点击退出应用菜单项时，退出应用
        app.quit()
      }
    }
  ])

  // 设置Tray的提示文字和上下文菜单
  tray.setToolTip('Harbour')
  tray.setContextMenu(contextMenu)

  // 绑定Tray点击事件，如果主窗口存在，则显示主窗口
  tray.on('click', () => {
    mainWindowIsExist() && getMainWindow().show()
  })
}

/*
 * 获取Tray实例
 * @returns {Tray} 返回当前的Tray实例
 */
function getTray() {
  return tray
}

/*
 * 模块导出
 */
module.exports = { initTray, getTray }
