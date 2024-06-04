import { Exec } from './index'
import path from 'path'
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
export function executePostcssPlugins(dir: string, pluginsPathList: string[]) {
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

// 示例：指定插件路径列表，并调用函数执行这些插件。
// 这里的插件路径是相对路径，示例中假设项目结构和插件位置。
const pluginsPathList = ['../plugins/postcss-plugins/property-sort']
executePostcssPlugins(path.join('src copy'), pluginsPathList)
