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
    await executeBabelPlugins(dir, babelPluginPathList)
  })

  ipcMain.handle('exec-jscodemod', async (event, dir: string, jscodemodeList) => {
    // 只在需要时导入 executeJSCodemods
    const { executeJSCodemods } = require('../exec/exec-jscodemod')
    await executeJSCodemods(dir, jscodemodeList)
  })

  ipcMain.handle('exec-posthtml', async (event, dir: string, posthtmlPluginPathList) => {
    const { executePosthtmlPlugins } = require('../exec/exec-posthtml-plugin')
    await executePosthtmlPlugins(dir, posthtmlPluginPathList)
  })

  ipcMain.handle('exec-postcss', async (event, dir: string, postcssPluginPathList) => {
    const { executePostcssPlugins } = require('../exec/exec-postcss-plugin')
    await executePostcssPlugins(dir, postcssPluginPathList)
  })

  ipcMain.handle('exec-file-statistical', async (event, dir: string) => {
    const { getProjectTree } = require('../exec/exec-file-statistical')
    return await getProjectTree(dir)
  })

  ipcMain.handle('exec-get-attrs-and-annotation', async (event, dir: string) => {
    const { getAttributesDescriptionTable } = require('../exec/exec-get-attrs-and-annotation')
    return await getAttributesDescriptionTable(dir)
  })

  ipcMain.handle(
    'exec-modify-file-names-batch-priview',
    async (event, dir: string, modifyFilenameOptions) => {
      const { useModifyFilenameExecPreset } = require('../exec/exec-modify-file-names-batch')
      return await useModifyFilenameExecPreset(dir, 'preview', modifyFilenameOptions)
    }
  )

  ipcMain.handle(
    'exec-modify-file-names-batch',
    async (event, dir: string, modifyFilenameOptions) => {
      const { useModifyFilenameExecPreset } = require('../exec/exec-modify-file-names-batch')
      return await useModifyFilenameExecPreset(dir, 'exec', modifyFilenameOptions)
    }
  )

  ipcMain.handle(
    'exec-reg-query-batch',
    async (
      event,
      dir: string,
      queryReg: RegExp,
      ignoreReg?: Array<RegExp>,
      isAddSourcePath?: boolean
    ) => {
      const { batchRegQueryAndReturnResult } = require('../exec/exec-reg-query-batch')
      return await batchRegQueryAndReturnResult(dir, queryReg, ignoreReg, isAddSourcePath)
    }
  )
}
