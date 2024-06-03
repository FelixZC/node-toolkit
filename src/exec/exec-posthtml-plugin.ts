import { Exec } from './index'
import path from 'path'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'

/**
 * 执行 PostCSS 插件的公共方法。
 * @param pluginsPathList 需要执行的 PostCSS 插件路径列表。
 */
export const executePostcssPlugins = (dir: string, pluginsPathList: string[]): void => {
  const exec = new Exec(dir)

  try {
    // 将插件路径列表映射为具体的 PostCSS 插件实例数组
    const plugins: PostcssPlugin[] = pluginsPathList.map((pluginPath) => {
      const result = require(pluginPath)

      // 确保 result.default 或 result 本身是 PostCSS 插件
      if (result.default && typeof result.default === 'function') {
        return result.default
      }
      return result
    })

    // 执行 PostCSS 插件
    exec.execPostcssPlugin(plugins)
  } catch (e) {
    console.warn('执行 PostCSS 插件时发生错误:', e)
  }
}

// 示例用法：
const pluginsPathList: string[] = ['../plugins/posthtml-plugins/property-sort']

// 调用公共方法执行 PostCSS 插件
executePostcssPlugins(path.join('src copy'), pluginsPathList)
