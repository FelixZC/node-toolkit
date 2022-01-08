import posthtml from 'posthtml'
import type { Plugin, Options } from 'posthtml'
import type { Options as parserOptions } from 'posthtml-parser'
import type { Options as renderOptions } from 'posthtml-render'
import type { execFileInfo } from './common'

interface mergeOptions extends Options, parserOptions, renderOptions {}

const usePosthtmlPlugin = async (execFileInfo: execFileInfo, pluginsPathList: string[] = []) => {
  try {
    const plugins: Plugin<unknown>[] = []
    if (pluginsPathList.length) {
      pluginsPathList.forEach((path) => {
        const result = require(path)
        if (result.default) {
          plugins.push(result.default)
        }
        return plugins.push(result)
      })
    }
    const result = await posthtml(plugins).process(execFileInfo.source, {
      recognizeSelfClosing: true,
      closingSingleTag: 'slash'
    } as mergeOptions)
    return result.html
  } catch (e) {
    console.log('获取plugin失败')
    console.log(e)
  }
}

export default usePosthtmlPlugin
