/**
 * 批量修改文件命名和引用为驼峰式规范
 * 执行批处理操作，包括使用babel、postcss和posthtml插件转换文件名和引用，
 * 以及修改文件名和目录名以符合驼峰式规范。
 */
import { Exec } from './index'
import * as fs from 'fs'
import * as path from 'path'
import { transferRef } from '../utils/common'
import type { BabelPlugin } from '../plugins/use-babel-plugin'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { Plugin as PosthtmlPlugin } from 'posthtml'

// 定义babel插件路径列表，用于加载插件
const babelPluginPathList: string[] = ['../plugins/babel-plugins/transfer-file-name-tok-kebab-case']

// 实例化Exec类，用于后续执行插件转换和文件名修改操作
const exec = new Exec()

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
  exec.execBabelPlugin(babelplugins)

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
  exec.execPostcssPlugin(postcssPlugins)

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
  exec.execPosthtmlPlugin(plugins)

  // 获取文件系统实例，用于后续的文件名和目录名修改操作
  const fsInstance = exec.fsInstance

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
  setTimeout(() => {
    // 修改文件名
    fsInstance.modifyFilename(customFilename, null, customDirname)
    // 遍历并删除空目录
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
