import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import * as exec from './index'
const pluginsPathList: string[] = ['../plugins/postcss-plugins/transferFileNameTokKebabCase']
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
  console.log(e)
}
