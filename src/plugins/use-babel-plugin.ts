import * as babel from '@babel/core'
import generator from '@babel/generator'
import { getGeneratorOption, getParserOption } from './babel-plugins/ast-utils'
import { logger } from '../utils/log'
import * as parser from '@babel/parser'
import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'
import traverse from '@babel/traverse'
import type * as Babel from '@babel/core'
import type { PluginObj, Visitor } from '@babel/core'
import type { ExecFileInfo } from '@src/types/common'
export type BabelAPI = typeof Babel
export interface CustomPluginObj extends PluginObj {
  getExtra?: () => Record<string, any>
  visitor: Visitor
}
export interface BabelPlugin {
  (babel: BabelAPI, options?: Record<string, any>, dirname?: string): CustomPluginObj
}

/**
 * 使用提供的 Babel 插件列表对给定的代码进行转换。
 * @param execFileInfo - 包含执行时文件信息的对象，如源代码、文件路径等。
 * @param pluginsList - 一个 Babel 插件函数列表。
 * @returns 转换后的代码字符串。
 */
const transform = (execFileInfo: ExecFileInfo, pluginsList: BabelPlugin[]) => {
  try {
    // 将代码解析为抽象语法树 (AST)
    const codeAst = parser.parse(execFileInfo.source, getParserOption())

    // 遍历插件列表，使用每个插件修改 AST
    for (const plugin of pluginsList) {
      const pluginObj = plugin(babel, {}, execFileInfo.path)
      traverse(codeAst, pluginObj.visitor)

      // 如果插件定义了 getExtra 方法，则调用并合并返回的额外信息到 execFileInfo.extra
      if (typeof pluginObj.getExtra === 'function') {
        execFileInfo.extra = {
          ...execFileInfo.extra,
          ...pluginObj.getExtra()
        }
      }
    }

    // 使用修改后的 AST 生成新的代码
    const newCode = generator(codeAst, getGeneratorOption(), execFileInfo.source)

    // 返回转换后的代码
    return `\n${newCode.code}\n`
  } catch (e) {
    logger.error(e)
    // 如果转换过程中出错，则返回原始代码
    return execFileInfo.source
  }
}

/**
 * 运行 Babel 插件。
 * 对于非 .vue 文件，直接使用 transform 函数转换代码。
 * 对于 .vue 文件，解析 SFC（Single File Component），并对 script 和 scriptSetup 部分应用转换。
 * @param execFileInfo - 包含执行时文件信息的对象，如源代码、文件路径等。
 * @param pluginsList - 一个 Babel 插件函数列表。
 * @returns 转换后的代码字符串。
 */
const runBabelPlugin = (execFileInfo: ExecFileInfo, pluginsList: BabelPlugin[]) => {
  // 如果没有插件需要运行，则直接返回原始源代码
  if (!pluginsList.length) {
    return execFileInfo.source
  }

  // 检查文件路径是否以 .vue 结尾
  const { path, source } = execFileInfo
  if (!path.endsWith('.vue')) {
    // 对非 .vue 文件应用插件列表并返回转换后的代码
    return transform(execFileInfo, pluginsList)
  }

  // 解析 Vue 单文件组件
  const { descriptor } = parseSFC(source, {
    filename: path
  })

  // 如果组件没有 script 或 scriptSetup 部分，则直接返回原始源代码
  if (!descriptor.script?.content && !descriptor.scriptSetup?.content) {
    return source
  }

  // 对 script 和 scriptSetup 部分分别应用插件列表，并更新对应的内容
  if (descriptor.script && descriptor.script.content) {
    execFileInfo.source = descriptor.script.content
    descriptor.script.content = transform(execFileInfo, pluginsList)
  }
  if (descriptor.scriptSetup && descriptor.scriptSetup.content) {
    execFileInfo.source = descriptor.scriptSetup.content
    descriptor.scriptSetup.content = transform(execFileInfo, pluginsList)
  }

  // 将更新后的 descriptor 字符串化并返回
  return stringifySFC(descriptor)
}
export default runBabelPlugin
