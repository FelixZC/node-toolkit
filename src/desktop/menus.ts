import { Menu, MenuItemConstructorOptions } from 'electron'
import { clearCacheAll } from '../utils/fs'
import { shell } from 'electron'
import { dialog } from 'electron'
import { logger } from '../utils/log'
import { getLogPath } from '../utils/log'
const getMenuTemplate = (mainWindow: Electron.BrowserWindow): Array<MenuItemConstructorOptions> => {
  const menuTemplate: Array<MenuItemConstructorOptions> = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Clear Files Cache',
          accelerator: 'CmdOrCtrl+F5',
          click: () => {
            clearCacheAll()
            dialog.showMessageBox({
              type: 'info',
              message: 'Alreadly clear cache all',
              buttons: ['OK']
            })
            console.log('Alreadly clear cache all')
          }
        },
        {
          label: 'Open Operate Log',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            const logPath = getLogPath()
            try {
              shell.openPath(logPath)
            } catch (error) {
              logger.error(error)
              dialog.showMessageBox({
                type: 'error',
                message: 'Error opening file',
                buttons: ['OK']
              })
              console.error(`Error opening file: ${error}`)
            }
          }
        },
        {
          role: 'quit'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ]
  return menuTemplate
}

export const createMenu = (mainWindow: Electron.BrowserWindow) => {
  const menuTemplate = getMenuTemplate(mainWindow)
  const applicationMenu = Menu.buildFromTemplate(menuTemplate)
  // 根据平台设置菜单
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(applicationMenu) // macOS上设置应用菜单
  } else {
    mainWindow.setMenu(applicationMenu) // 其他平台上设置窗口菜单
  }
}
