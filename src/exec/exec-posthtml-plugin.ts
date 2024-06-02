/**
 * 执行posthtml插件
 */
import { Exec } from './index'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
const pluginsPathList: string[] = ['../plugins/posthtml-plugins/property-sort']
const exec = new Exec()

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
  console.warn(e)
}
