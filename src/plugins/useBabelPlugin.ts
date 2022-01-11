import { parse as parseSFC, stringify as stringifySFC } from './sfcUtils'
import * as babel from '@babel/core'
import generator from '@babel/generator' // ast 格式化网站   https://astexplorer.net/
// https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md babel中文文档

import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import type { ExecFileInfo } from './common'
import type * as Babel from '@babel/core'
import type { PluginObj, Visitor } from '@babel/core'
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
    //1，先将代码转换成ast
    const codeAst = parser.parse(execFileInfo.source, {
      // default: "script"
      // default: []
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
      sourceType: 'module',
    }) //2,分析修改AST，第一个参数是AST，第二个参数是访问者对象

    for (const plugin of pluginsList) {
      const pluginObj = plugin(babel)
      traverse(codeAst, pluginObj.visitor)

      if (typeof pluginObj.getExtra === 'function') {
        execFileInfo.extra = { ...execFileInfo.extra, ...pluginObj.getExtra() }
      }
    } //3，生成新的代码，第一个参数是AST，第二个是一些可选项，第三个参数是原始的code

    const newCode = generator(
      codeAst,
      {
        compact: 'auto',
        concise: false,
        retainLines: false,
      },
      execFileInfo.source
    ) //会返回一个对象，code就是生成后的新代码

    return newCode.code
  } catch (e) {
    console.log(execFileInfo.path, e)
    return execFileInfo.source
  }
}

const runBabelPlugin = (
  execFileInfo: ExecFileInfo,
  pluginsList: BabelPlugin[]
) => {
  if (!pluginsList.length) {
    return execFileInfo.source
  }

  if (!execFileInfo.path.endsWith('.vue')) {
    return transform(execFileInfo, pluginsList)
  } else {
    const { descriptor } = parseSFC(execFileInfo.source, {
      filename: execFileInfo.path,
    })
    const scriptBlock = descriptor.script

    if (scriptBlock) {
      execFileInfo.source = scriptBlock.content
      const newScriptContent = transform(execFileInfo, pluginsList)
      scriptBlock.content = newScriptContent
    }

    return stringifySFC(descriptor)
  }
}

export default runBabelPlugin
