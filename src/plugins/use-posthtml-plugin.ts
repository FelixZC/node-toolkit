import posthtml from 'posthtml'
import type { ExecFileInfo } from './common'
import type { Options, Plugin as PosthtmlPlugin } from 'posthtml'
import type { Options as parserOptions } from 'posthtml-parser'
import type { Options as renderOptions } from 'posthtml-render'
interface MergeOptions extends Options, parserOptions, renderOptions {}

/**
 * 运行 PostHTML 插件
 *
 * @param execFileInfo 执行文件信息，包含源文件内容和额外信息
 * @param posthtmlPlugin PostHTML 插件数组，默认为空数组
 * @returns 处理后的HTML字符串
 */
const runPosthtmlPlugin = async (
  execFileInfo: ExecFileInfo,
  posthtmlPlugin: PosthtmlPlugin<unknown>[] = []
) => {
  // 使用PostHTML处理HTML内容
  const result = await posthtml<any, any>(posthtmlPlugin).process(execFileInfo.source, {
    closingSingleTag: 'slash',
    recognizeSelfClosing: true
  } as MergeOptions)

  // 如果存在额外信息，将处理结果中的消息合并到额外信息中
  if (execFileInfo.extra) {
    for (const message of result.messages) {
      switch (typeof message) {
        case 'object':
          // 合并对象消息
          for (const key in message) {
            execFileInfo.extra[key] = message[key]
          }
          break

        case 'string':
          // 添加字符串消息
          execFileInfo.extra[message] = message
          break

        /**其他忽略 */

        default:
      }
    }
  }

  return result.html // 返回处理后的HTML字符串
}

export default runPosthtmlPlugin
