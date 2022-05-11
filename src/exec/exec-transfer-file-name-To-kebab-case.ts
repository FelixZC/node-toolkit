/**
 * 批量修改文件命名和引用为驼峰式规范
 */
import { transferRef } from '../utils/common'
import * as exec from './index'
import * as fs from 'fs'
import * as path from 'path'
import type { BabelPlugin } from '../plugins/use-babel-plugin'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
const babelPluginPathList: string[] = ['../plugins/babel-plugins/transfer-file-name-tok-kebab-case']

try {
  /**
   * babel转换
   */
  const babelplugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
    const result = require(pluginPath)

    if (result.default) {
      return result.default
    }

    return result
  })
  exec.execBabelPlugin(babelplugins)
  /**postcss转化 */

  const postcssPluginsPathList: string[] = [
    '../plugins/postcss-plugins/transfer-file-name-tok-kebab-case'
  ]
  const postcssPlugins: PostcssPlugin[] = postcssPluginsPathList.map((pluginPath) => {
    const result = require(pluginPath)

    if (result.default) {
      return result.default
    }

    return result
  })
  exec.execPostcssPlugin(postcssPlugins)
  /**posthtml转化 */

  const posthtmlPluginsPathList: string[] = [
    '../plugins/posthtml-plugins/transfer-file-name-tok-kebab-case'
  ]
  const plugins: PosthtmlPlugin<unknown>[] = posthtmlPluginsPathList.map((pluginPath) => {
    const result = require(pluginPath)

    if (result.default) {
      return result.default
    }

    return result
  })
  exec.execPosthtmlPlugin(plugins)
  /**变更文件名 */

  const fsInstance = exec.getFsInstance()

  const customBaseName = (filePath: string) => {
    const oldExtensionName = path.extname(filePath) // 文件扩展名

    const oldBaseName = path.basename(filePath, oldExtensionName) // 文件名

    return transferRef(oldBaseName, '\\')
  }

  const customDirName = (filePath: string) => {
    const oldDirName = path.dirname(filePath) // 文件扩展名

    const relativeDir = path.relative(
      'C:/Users/ZC/Documents/project/node-project/pzc-toolbox',
      oldDirName
    )
    return transferRef(relativeDir, '\\')
  }

  setTimeout(() => {
    fsInstance.modifyFileName(customBaseName, null, null, null, customDirName)
    fsInstance.dirPathList.reverse().forEach((folderPath) => {
      const result = fs.readdirSync(folderPath)

      if (!result.length) {
        fs.rmdirSync(folderPath)
      }
    })
  }, 0)
} catch (e) {
  console.warn(e)
}
