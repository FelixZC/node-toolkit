import { ipcMain } from 'electron'
export default function mainWindowHandleEvents() {
  ipcMain.handle('choose-directory', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.filePaths
  })

  ipcMain.handle('exec-babel', async (event, dir, babelPluginPathList) => {
    // 只在需要时导入 executeBabelPlugins
    const { executeBabelPlugins } = require('../exec/exec-babel-plugin')
    executeBabelPlugins(dir, babelPluginPathList)
  })

  ipcMain.handle('exec-jscodemod', async (event, dir, jscodemodeList) => {
    // 只在需要时导入 executeJSCodemods
    const { executeJSCodemods } = require('../exec/exec-jscodemod')
    executeJSCodemods(dir, jscodemodeList)
  })
}
