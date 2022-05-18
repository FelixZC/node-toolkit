import * as babel from '@babel/core'
import generator from '@babel/generator'
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
  (babel: BabelAPI): CustomPluginObj
}

const transform = (execFileInfo: ExecFileInfo, pluginsList: BabelPlugin[]) => {
  try {
    /** 1，先将代码转换成ast */
    const codeAst = parser.parse(execFileInfo.source, {
      allowImportExportEverywhere: false,
      plugins: ['decorators-legacy', 'jsx', 'typescript'],
      sourceType: 'module'
    })
    /** 2,分析修改AST，第一个参数是AST，第二个参数是访问者对象 */

    for (const plugin of pluginsList) {
      const pluginObj = plugin(babel)
      traverse(codeAst, pluginObj.visitor)

      if (typeof pluginObj.getExtra === 'function') {
        execFileInfo.extra = { ...execFileInfo.extra, ...pluginObj.getExtra() }
      }
    }
    /** 3，生成新的代码，第一个参数是AST，第二个是一些可选项，第三个参数是原始的code */

    const newCode = generator(
      codeAst,
      {
        compact: 'auto',
        concise: false,
        retainLines: false
      },
      execFileInfo.source
    )
    /** 会返回一个对象，code就是生成后的新代码 */

    return `\n${newCode.code}\n`
  } catch (e) {
    return execFileInfo.source
  }
}

const runBabelPlugin = (execFileInfo: ExecFileInfo, pluginsList: BabelPlugin[]) => {
  if (!pluginsList.length) {
    return execFileInfo.source
  }

  if (!execFileInfo.path.endsWith('.vue')) {
    return transform(execFileInfo, pluginsList)
  }

  const { descriptor } = parseSFC(execFileInfo.source, {
    filename: execFileInfo.path
  })
  const scriptBlock = descriptor.script || descriptor.scriptSetup

  if (scriptBlock) {
    execFileInfo.source = scriptBlock.content
    const out = transform(execFileInfo, pluginsList)
    scriptBlock.content = out
  }
  /** 强制重新赋值 */

  descriptor.script = scriptBlock
  return stringifySFC(descriptor)
}

export default runBabelPlugin
