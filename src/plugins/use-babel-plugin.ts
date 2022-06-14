import * as babel from '@babel/core'
import generator from '@babel/generator'
import { getGeneratorOption, getParserOption } from './babel-plugins/ast-utils'
import * as parser from '@babel/parser'
import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'
import traverse from '@babel/traverse'
import type * as Babel from '@babel/core'
import type { PluginObj, Visitor } from '@babel/core'
import type { ExecFileInfo } from './common'
export type BabelAPI = typeof Babel
export interface CustomPluginObj extends PluginObj {
  getExtra?: () => Record<string, any>
  visitor: Visitor
}
export interface BabelPlugin {
  (babel: BabelAPI, options?: Record<string, any>, dirname?: string): CustomPluginObj
}

const transform = (execFileInfo: ExecFileInfo, pluginsList: BabelPlugin[]) => {
  try {
    /** 1，先将代码转换成ast */
    const codeAst = parser.parse(execFileInfo.source, getParserOption())
    /** 2,分析修改AST，第一个参数是AST，第二个参数是访问者对象 */

    for (const plugin of pluginsList) {
      const pluginObj = plugin(babel, {}, execFileInfo.path)
      traverse(codeAst, pluginObj.visitor)

      if (typeof pluginObj.getExtra === 'function') {
        execFileInfo.extra = { ...execFileInfo.extra, ...pluginObj.getExtra() }
      }
    }
    /** 3，生成新的代码，第一个参数是AST，第二个是一些可选项，第三个参数是原始的code */

    const newCode = generator(codeAst, getGeneratorOption(), execFileInfo.source)
    /** 会返回一个对象，code就是生成后的新代码 */

    return `\n${newCode.code}\n`
  } catch (e) {
    console.error(e)
    return execFileInfo.source
  }
}

const runBabelPlugin = (execFileInfo: ExecFileInfo, pluginsList: BabelPlugin[]) => {
  if (!pluginsList.length) {
    return execFileInfo.source
  }

  const { path, source } = execFileInfo

  if (!path.endsWith('.vue')) {
    return transform(execFileInfo, pluginsList)
  }

  const { descriptor } = parseSFC(source, {
    filename: path
  })

  if (!descriptor.script?.content && !descriptor.scriptSetup?.content) {
    return source
  }

  if (descriptor.script && descriptor.script.content) {
    execFileInfo.source = descriptor.script.content
    descriptor.script.content = transform(execFileInfo, pluginsList)
  }

  if (descriptor.scriptSetup && descriptor.scriptSetup.content) {
    execFileInfo.source = descriptor.scriptSetup.content
    descriptor.scriptSetup.content = transform(execFileInfo, pluginsList)
  }

  return stringifySFC(descriptor)
}

export default runBabelPlugin
