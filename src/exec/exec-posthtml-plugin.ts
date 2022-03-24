import type { Plugin as PosthtmlPlugin } from 'posthtml'
import * as exec from './index'
const pluginsPathList: string[] = ['../plugins/posthtml-plugins/property-sort']

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
  console.log(e)
}
