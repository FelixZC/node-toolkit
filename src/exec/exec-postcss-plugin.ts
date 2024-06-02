/**
 * 执行postcss插件
 */
import { Exec } from './index'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
const pluginsPathList: string[] = ['../plugins/postcss-plugins/transfer-file-name-tok-kebab-case']
const exec = new Exec()

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
