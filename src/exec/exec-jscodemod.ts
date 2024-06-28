import type { Transform } from 'jscodeshift'
import { logger } from '../utils/log'
import fsUtils, { readFile, writeFile } from '../utils/fs'
import * as cliProgress from '../utils/cli-progress'
import { Notification } from 'electron'
import { getMainWindow } from '../desktop/main-window'
import runCodemod from '../plugins/use-codemod'
import type { ExecFileInfo } from '../types/common'
/**
 * 执行 JSCodeMod 模板的公共方法。
 * @param jscodemodeList 需要执行的 JSCodeMod 模板路径列表。
 */
export const execJSCodemods = async (
  dir: string,
  jscodemodeList: string[],
  isUseIgnoredFiles: boolean
) => {
  const fsInstance = new fsUtils(dir, isUseIgnoredFiles)
  const fileInfoList = fsInstance.getFileInfoList()
  try {
    // 将模板路径列表映射为具体的 Transform 函数数组
    const codemodList: Transform[] = jscodemodeList.map((filePath) => {
      const result = require(filePath)

      // 确保 result.default 或 result 本身是 JSCodeMod 转换函数
      if (result.default && typeof result.default === 'function') {
        return result.default
      }
      return result
    })

    const successList: string[] = [] // 执行改动文件列表
    const errorList: string[] = [] // 执行错误列表
    // 定义一个处理函数，用于处理单个文件的转换
    const handler = async (filePath: string) => {
      try {
        // 读取文件内容
        const content = await readFile(filePath)
        // 准备转换所需的文件信息
        const execFileInfo: ExecFileInfo = {
          path: filePath,
          source: content
        }
        // 执行所有转换操作，并获取转换后的内容
        const newContent = runCodemod(execFileInfo, codemodList, {})

        // 如果转换后的内容与原内容相同或转换后的内容为空，则不进行写入操作
        if (newContent === content || !newContent.length) {
          return
        }

        // 将转换后的内容写入文件
        await writeFile(filePath, newContent)
        successList.push(filePath)
      } catch (e) {
        // 捕获并打印转换过程中可能出现的错误
        logger.warn(e)
        errorList.push(filePath)
      }
    }
    const vaildList = [
      '.js',
      // JavaScript 文件
      '.jsx',
      // React JSX 文件
      '.ts',
      // TypeScript 文件
      '.tsx',
      // TypeScript JSX 文件
      '.mjs',
      // ES 模块 JavaScript 文件
      '.cjs',
      // CommonJS 模块 JavaScript 文件（通常不需要 Babel 处理，但可以配置）
      '.vue'
    ]
    // 筛选出符合后缀名条件的文件信息列表
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.ext))
    // 初始化进度条，用于显示转换进度
    const { updateBar } = cliProgress.useCliProgress(targetList.length)
    // 遍历所有有效文件，逐一处理，并更新进度条
    let count = 1
    const mainWindow = getMainWindow()
    for (const item of targetList) {
      await handler(item.filePath)
      updateBar()
      mainWindow && mainWindow.setProgressBar(count++ / targetList.length)
    }
    mainWindow &&
      new Notification({
        title: '处理完成',
        body: `共扫描${targetList.length}个文件，执行改动文件${successList.length}个，执行失败文件${errorList.length}个`
      }).show()
    return {
      successList,
      errorList
    }
  } catch (e) {
    logger.warn('执行 JSCodeMod 模板时发生错误:', e)
  }
}
