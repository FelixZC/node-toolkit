import posthtml from 'posthtml'
import type { Options as parserOptions } from 'posthtml-parser'
import type { Options as renderOptions } from 'posthtml-render'
import type { Options, Plugin as PosthtmlPlugin } from 'posthtml'
import type { ExecFileInfo } from './common'

interface MergeOptions extends Options, parserOptions, renderOptions {}

const runPosthtmlPlugin = async (
  execFileInfo: ExecFileInfo,
  pluginsList: PosthtmlPlugin<unknown>[] = []
) => {
  const result = await posthtml(pluginsList).process(execFileInfo.source, {
    closingSingleTag: 'slash',
    recognizeSelfClosing: true
  } as MergeOptions)
  return result.html
}

export default runPosthtmlPlugin
