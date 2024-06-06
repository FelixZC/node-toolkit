import { ipcMain } from 'electron'
export default function mainWindowHandleEvents() {
  ipcMain.handle('choose-directory', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.filePaths
  })

  ipcMain.handle('exec-babel', async (event, dir: string, babelPluginPathList) => {
    // 只在需要时导入 executeBabelPlugins
    const { executeBabelPlugins } = require('../exec/exec-babel-plugin')
    executeBabelPlugins(dir, babelPluginPathList)
  })

  ipcMain.handle('exec-jscodemod', async (event, dir: string, jscodemodeList) => {
    // 只在需要时导入 executeJSCodemods
    const { executeJSCodemods } = require('../exec/exec-jscodemod')
    executeJSCodemods(dir, jscodemodeList)
  })

  ipcMain.handle('exec-posthtml', async (event, dir: string, posthtmlPluginPathList) => {
    const { executePosthtmlPlugins } = require('../exec/exec-posthtml-plugin')
    executePosthtmlPlugins(dir, posthtmlPluginPathList)
  })

  ipcMain.handle('exec-postcss', async (event, dir: string, postcssPluginPathList) => {
    const { executePostcssPlugins } = require('../exec/exec-postcss-plugin')
    executePostcssPlugins(dir, postcssPluginPathList)
  })

  ipcMain.handle('classify-files-group', async (event, dir: string) => {
    const { classifyFiles } = require('../exec/classify-files-group')
    const result = classifyFiles(dir)
    return result
  })

  ipcMain.handle('exec-get-attrs-and-annotation', async (event, dir: string) => {
    const { getAttributesDescriptionTable } = require('../exec/exec-get-attrs-and-annotation')
    const result = getAttributesDescriptionTable(dir)
    return result
  })
  ipcMain.handle(
    'exec-reg-query-batch',
    async (
      event,
      dir: string,
      queryRegExp: RegExp,
      ignoreRegExp?: Array<RegExp>,
      isAddSourcePath?: boolean
    ) => {
      const { batchRegQueryAndReturnResult } = require('../exec/exec-reg-query-batch')
      const result = batchRegQueryAndReturnResult(dir, queryRegExp, ignoreRegExp, isAddSourcePath)
      return result
    }
  )
}
