import { logger } from '../utils/log'
import * as cliProgress from '../utils/cli-progress'
import fsUtils, { readFile, writeFile } from '../utils/fs'
import { getMainWindow } from '../desktop/main-window'
import { Notification } from 'electron'
import runPostcssPlugin from '../plugins/use-postcss-plugin'
import type { ExecFileInfo } from '../types/common'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'

/**
 * 执行PostCSS插件。
 * 此函数负责根据提供的插件路径列表，加载插件并执行它们。
 * 它首先创建一个Exec实例，然后尝试加载每个插件，并将它们传递给Exec实例的execPostcssPlugin方法来实际执行插件。
 * 如果在加载或执行插件过程中发生错误，它将捕获异常并打印警告。
 *
 * @param {string[]} dir - 工作目录，用于执行插件。
 * @param {string[]} pluginsPathList - PostCSS插件的路径列表。
 */
export async function execPostcssPlugins(
  dir: string,
  pluginsPathList: string[],
  isUseIgnoredFiles: boolean
) {
  try {
    const fsInstance = new fsUtils(dir, isUseIgnoredFiles)
    const fileInfoList = fsInstance.getFileInfoList()
    const plugins: PostcssPlugin[] = pluginsPathList.map((pluginPath) => {
      const result = require(pluginPath)
      if (result.default) {
        return result.default
      }
      return result
    })
    /**
     * 执行PostCSS插件处理文件。
     * @param plugins PostCSS插件数组，将按顺序对文件内容进行处理。
     */
    const successList: string[] = [] // 执行改动文件列表
    const errorList: string[] = [] // 执行错误列表
    // 定义一个处理单个文件的异步函数。
    const handler = async (filePath: string) => {
      try {
        // 读取文件内容。
        const content = await readFile(filePath)
        // 准备文件信息，以供插件处理使用。
        const execFileInfo: ExecFileInfo = {
          path: filePath,
          source: content
        }
        // 使用插件处理文件内容。
        const result = await runPostcssPlugin(execFileInfo, plugins)

        // 如果处理结果与原内容相同或结果为空，则不进行写入操作。
        if (result === content || !result.length) {
          return
        }

        // 将处理后的内容写回文件。
        await writeFile(filePath, result)
        successList.push(filePath)
      } catch (e) {
        // 捕获并警告处理过程中可能出现的错误。
        logger.warn(e)
        errorList.push(filePath)
      }
    }

    // 定义有效文件扩展名列表。
    const vaildList = [
      '.css',
      // 标准的 CSS 文件
      '.less',
      // LESS 预处理器文件
      '.scss',
      // SCSS 预处理器文件
      '.sass',
      // Sass 预处理器文件（使用缩进）
      '.styl',
      // Stylus 预处理器文件
      '.pcss',
      // PostCSS CSS 兼容语法文件
      '.sss' // SugarSS 语法文件
      // '.jsx',  // React JSX 文件，可能包含 CSS-in-JS，太损了
      // '.tsx',   // TypeScript 文件，也可能包含 CSS-in-JS，太损了
      // 可以添加更多通过插件支持的文件后缀
    ]
    // 筛选出需要处理的文件列表。
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.ext))
    // 初始化进度条，用于批量处理文件时的进度显示。
    const { updateBar } = cliProgress.useCliProgress(targetList.length) // 初始化进度条。
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
    logger.warn(e)
  }
}
