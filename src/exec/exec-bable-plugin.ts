/**
 * 执行babel插件，执行前，请将注释单行注释更改为多行注释，以防错位
 * ^//(.*) => /**$1 *\/
 */
import * as exec from './index'
import type { BabelPlugin } from '../plugins/use-babel-plugin'
const babelPluginPathList: string[] = [
  '../plugins/babel-plugins/import-sort',
  '../plugins/babel-plugins/move-default-export-to-last',
  '../plugins/babel-plugins/depart-switch'
  // '../plugins/babel-plugins/remove-invalid-comment'
  // '../plugins/babel-plugins/transform-remove-console'
  // '../plugins/babel-plugins/depart-default-export-object-express'
  // '../plugins/babel-plugins/replace-memberExpress-object-or-property'
]

try {
  const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
    const result = require(pluginPath)

    if (result.default) {
      return result.default
    }

    return result
  })
  exec.execBabelPlugin(plugins)
} catch (e) {
  console.warn(e)
}
