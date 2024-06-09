import { Exec } from './index'
import path from 'path'
import type { BabelPlugin } from '../plugins/use-babel-plugin'

/**
 * 执行 Babel 插件的公共方法。
 * @param babelPluginPathList 需要执行的 Babel 插件路径列表。
 */
export const executeBabelPlugins = async (dir: string, babelPluginPathList: string[]) => {
  const exec = new Exec(dir)

  try {
    // 将插件路径列表映射为具体的插件实例数组
    const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
      const result = require(pluginPath) // 使用 require 加载插件

      // 确保 result.default 或 result 本身是 Babel 插件
      if (result.default && typeof result.default === 'function') {
        return result.default
      }
      return result
    })

    // 执行 Babel 插件
    await exec.execBabelPlugin(plugins)
  } catch (e) {
    console.warn('执行 Babel 插件时发生错误:', e)
  }
}

// 使用示例
export function test() {
  const babelPluginPathList: string[] = [
    '../plugins/babel-plugins/import-sort',
    '../plugins/babel-plugins/move-default-export-to-last',
    '../plugins/babel-plugins/depart-switch',
    // '../plugins/babel-plugins/remove-invalid-comment'
    '../plugins/babel-plugins/transform-remove-console'
    // '../plugins/babel-plugins/depart-default-export-object-express'
    // '../plugins/babel-plugins/replace-memberExpress-object-or-property'
  ]
  executeBabelPlugins(path.join('src copy'), babelPluginPathList)
}
// test()
