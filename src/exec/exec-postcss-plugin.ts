import { Exec } from './index'
import path from 'path'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'

/**
 * 执行postcss插件
 * @param {string[]} pluginsPathList - 插件的路径列表
 */
function executePostcssPlugins(dir: string, pluginsPathList: string[]) {
  const exec = new Exec(dir)

  try {
    const plugins: PostcssPlugin[] = pluginsPathList.map((pluginPath) => {
      const result = require(pluginPath)

      if (result.default) {
        return result.default
      }

      return result
    })

    exec.execPostcssPlugin(plugins)
  } catch (e) {
    console.warn(e)
  }
}

// 使用示例
const pluginsPathList = ['../plugins/postcss-plugins/transfer-file-name-tok-kebab-case']
executePostcssPlugins(path.join('src copy'), pluginsPathList)
