import { logger } from '../utils/log'
import * as path from 'path'
import { transferRef } from '../utils/common'
/**
 * 批量修改文件命名和引用为驼峰式规范
 * 执行批处理操作，包括使用babel、postcss和posthtml插件转换文件名和引用，
 * 以及修改文件名和目录名以符合驼峰式规范。
 */
import { useModifyFilenameExec } from './exec-modify-file-names-batch'
import type { BabelPlugin } from '../plugins/use-babel-plugin'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
export async function execTransferFileNameToKebabCase() {
  // 定义babel插件路径列表，用于加载插件
  const babelPluginPathList: string[] = [
    '../plugins/babel-plugins/transfer-file-name-tok-kebab-case'
  ]
  const dir = path.join('src copy')
  // 实例化Exec类，用于后续执行插件转换和文件名修改操作
  const modifyFilenameExec = useModifyFilenameExec(dir, true)
  const exec = modifyFilenameExec.exec
  try {
    /**
     * 加载并执行babel插件
     * 通过遍历插件路径列表，动态加载插件，并执行插件转换操作。
     */
    const babelplugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
      const result = require(pluginPath)

      // 如果插件导出的是默认值，则使用默认值，否则直接使用插件
      if (result.default) {
        return result.default
      }
      return result
    })
    await exec.execBabelPlugin(babelplugins)

    // 定义postcss插件路径列表，用于加载插件
    const postcssPluginsPathList: string[] = [
      '../plugins/postcss-plugins/transfer-file-name-tok-kebab-case'
    ]

    /**
     * 加载并执行postcss插件
     * 通过遍历插件路径列表，动态加载插件，并执行插件转换操作。
     */
    const postcssPlugins: PostcssPlugin[] = postcssPluginsPathList.map((pluginPath) => {
      const result = require(pluginPath)

      // 如果插件导出的是默认值，则使用默认值，否则直接使用插件
      if (result.default) {
        return result.default
      }
      return result
    })
    await exec.execPostcssPlugin(postcssPlugins)

    // 定义posthtml插件路径列表，用于加载插件
    const posthtmlPluginsPathList: string[] = [
      '../plugins/posthtml-plugins/transfer-file-name-tok-kebab-case'
    ]

    /**
     * 加载并执行posthtml插件
     * 通过遍历插件路径列表，动态加载插件，并执行插件转换操作。
     */
    const plugins: PosthtmlPlugin<unknown>[] = posthtmlPluginsPathList.map((pluginPath) => {
      const result = require(pluginPath)

      // 如果插件导出的是默认值，则使用默认值，否则直接使用插件
      if (result.default) {
        return result.default
      }
      return result
    })
    await exec.execPosthtmlPlugin(plugins)
    // 定义文件名转换函数，将文件名从其他格式转换为驼峰式
    const customFilename = (oldFilename: string) => {
      return transferRef(oldFilename, '\\')
    }

    // 定义目录名转换函数，将目录名从其他格式转换为驼峰式
    const customDirname = (oldDirname: string) => {
      const relativeDir = path.relative(process.cwd(), oldDirname)
      return transferRef(relativeDir, '\\')
    }

    // 延迟执行文件名和目录名修改操作，确保前面的插件执行完成
    // 修改文件名
    await modifyFilenameExec.execModifyFileNamesBatchCustom({
      customFilename,
      customDirname
    })
  } catch (e) {
    logger.warn(e)
  }
}
