import posthtml from 'posthtml'
import type { Plugin as PosthtmlPlugin, Options } from 'posthtml'
import type { Options as parserOptions } from 'posthtml-parser'
import type { Options as renderOptions } from 'posthtml-render'
import type { ExecFileInfo } from './common'

interface MergeOptions extends Options, parserOptions, renderOptions {}

const getPosthtmlPluginActuator = async (
  execFileInfo: ExecFileInfo,
  plugins: PosthtmlPlugin<unknown>[] = []
) => {
  const result = await posthtml(plugins).process(execFileInfo.source, {
    recognizeSelfClosing: true,
    closingSingleTag: 'slash',
  } as MergeOptions)
  return result.html
}
export default getPosthtmlPluginActuator
