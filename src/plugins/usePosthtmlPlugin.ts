import posthtml from 'posthtml'
import type { Options as parserOptions } from 'posthtml-parser'
import type { Options as renderOptions } from 'posthtml-render'
import type { ExecFileInfo } from './common'
import type { Options, Plugin as PosthtmlPlugin } from 'posthtml'
interface MergeOptions extends Options, parserOptions, renderOptions {}

const runPosthtmlPlugin = async (
  execFileInfo: ExecFileInfo,
  plugins: PosthtmlPlugin<unknown>[] = []
) => {
  const result = await posthtml(plugins).process(execFileInfo.source, {
    closingSingleTag: 'slash',
    recognizeSelfClosing: true,
  } as MergeOptions)
  return result.html
}

export default runPosthtmlPlugin
