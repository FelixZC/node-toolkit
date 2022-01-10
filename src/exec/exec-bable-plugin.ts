import * as exec from './index'
import type { BabelPlugin } from '../plugins/useBabelPlugin'
const babelPluginPathList: string[] = []
try {
  const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
    const result = require(pluginPath)
    if (result.default) {
      return result.default
    }
    return result
  })
  exec.execBabelPlugin(
    plugins,
    'src/components/AMS_WorkbaseComponents/common/ApiMethod.js'
  )
} catch (e) {
  console.log('获取visitor失败', e)
}
