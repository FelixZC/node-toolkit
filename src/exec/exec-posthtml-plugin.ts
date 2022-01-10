import type { Plugin as PosthtmlPlugin } from 'posthtml'
import * as exec from './index'
const pluginsPathList: string[] = []

try {
  const plugins: PosthtmlPlugin<unknown>[] = pluginsPathList.map(
    (pluginPath) => {
      const result = require(pluginPath)

      if (result.default) {
        return result.default
      }

      return result
    }
  )
  exec.execPosthtmlPlugin(plugins)
} catch (e) {
  console.log('获取plugin失败')
  console.log(e)
}