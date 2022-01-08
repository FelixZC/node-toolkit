import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import type { execFileInfo } from './common'

const usePostcssPlugin = async (execFileInfo: execFileInfo, pluginsPathList: string[] = []) => {
  const plugins = [autoprefixer]
  try {
    if (pluginsPathList.length) {
      pluginsPathList.forEach((path) => {
        const result = require(path)
        if (result.default) {
          plugins.push(result.default)
        }
        return plugins.push(result)
      })
    }
    const result = await postcss(plugins).process(execFileInfo.source, {})
    return result.css
  } catch (e) {
    console.log('获取plugin失败')
    console.log(e)
  }
}
export default usePostcssPlugin
