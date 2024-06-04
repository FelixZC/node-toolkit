import { Exec } from './index'
import path from 'path'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
/**
 * 在给定目录下执行PostHTML插件。
 * 此函数负责加载并执行一系列PostHTML插件，这些插件由插件路径列表指定。
 * @param dir {string} - 工作目录的路径，插件将在该目录下执行。
 * @param pluginsPathList {string[]} - PostHTML插件的路径列表，每个路径都是一个Node.js模块的路径。
 */
function executePosthtmlPlugins(dir: string, pluginsPathList: string[]): void {
  const exec = new Exec(dir)

  try {
    const plugins: PosthtmlPlugin<unknown>[] = pluginsPathList.map((pluginPath) => {
      const result = require(pluginPath)

      if (result.default) {
        return result.default
      }

      return result
    })

    exec.execPosthtmlPlugin(plugins)
  } catch (e) {
    // 可以在这里添加更详细的错误处理逻辑
    console.error('Error executing PostHTML plugins:', e)
  }
}

// 使用示例
const pluginsPathList: string[] = ['../plugins/posthtml-plugins/property-sort']
executePosthtmlPlugins(path.join('src copy'), pluginsPathList)
