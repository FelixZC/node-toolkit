import posthtml from 'posthtml'
import type { Options as parserOptions } from 'posthtml-parser'
import type { Options as renderOptions } from 'posthtml-render'
import type { Options, Plugin as PosthtmlPlugin } from 'posthtml'
import type { ExecFileInfo } from './common'
interface MergeOptions extends Options, parserOptions, renderOptions {}

const runPosthtmlPlugin = async (
  execFileInfo: ExecFileInfo,
  posthtmlPlugin: PosthtmlPlugin<unknown>[] = []
) => {
  const result = await posthtml<any, any>(posthtmlPlugin).process(execFileInfo.source, {
    closingSingleTag: 'slash',
    recognizeSelfClosing: true
  } as MergeOptions)

  if (execFileInfo.extra) {
    for (const message of result.messages) {
      switch (typeof message) {
        case 'object':
          for (const key in message) {
            execFileInfo.extra[key] = message[key]
          }

          break

        case 'string':
          execFileInfo.extra[message] = message
          break

        /**其他忽略 */

        default:
      }
    }
  }

  return result.html
}

export default runPosthtmlPlugin
