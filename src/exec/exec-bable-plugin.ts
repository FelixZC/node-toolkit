import * as exec from './index'
import type { BabelPlugin } from '../plugins/useBabelPlugin'
const babelPluginPathList: string[] = ['../plugins/babel-plugins/import-sort']

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
  console.log('获取visitor失败', e)
}
