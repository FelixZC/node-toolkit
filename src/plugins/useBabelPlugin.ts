// ast 格式化网站   https://astexplorer.net/
// https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md babel中文文档
import babel from '@babel/core'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generator from '@babel/generator'
import { parse as parseSFC, stringify as stringifySFC } from './sfcUtils'
import type { PluginObj, Visitor } from '@babel/core'
import type { execFileInfo } from './common'
interface customPluginObj extends PluginObj {
  getExtra?: () => Record<string, any>
  visitor: Visitor
}

const transform = (execFileInfo: execFileInfo, pluginsList: customPluginObj[]) => {
  try {
    //1，先将代码转换成ast
    const codeAst = parser.parse(execFileInfo.source, {
      sourceType: 'module', // default: "script"
      plugins: ['jsx'] // default: []
    })
    //2,分析修改AST，第一个参数是AST，第二个参数是访问者对象
    for (const plugin of pluginsList) {
      traverse(codeAst, plugin.visitor)
      if (typeof plugin.getExtra === 'function') {
        execFileInfo.extra = { ...execFileInfo.extra, ...plugin.getExtra() }
      }
    }
    //3，生成新的代码，第一个参数是AST，第二个是一些可选项，第三个参数是原始的code
    const newCode = generator(
      codeAst,
      {
        retainLines: false,
        compact: 'auto',
        concise: false
      },
      execFileInfo.source
    )

    //会返回一个对象，code就是生成后的新代码
    return newCode.code
  } catch (e) {
    console.log(execFileInfo.path, e)
    return execFileInfo.source
  }
}

const getBabelPluginActuator = (pluginsList: customPluginObj[]) => {
  return function (execFileInfo: execFileInfo) {
    if (!execFileInfo.path.endsWith('.vue')) {
      return transform(execFileInfo, pluginsList)
    } else {
      const { descriptor } = parseSFC(execFileInfo.source, { filename: execFileInfo.path })
      const scriptBlock = descriptor.script
      if (scriptBlock) {
        execFileInfo.source = scriptBlock.content
        const newScriptContent = transform(execFileInfo, pluginsList)
        scriptBlock.content = newScriptContent
      }
      return stringifySFC(descriptor)
    }
  }
}

const useBabelPlugin = (pluginPathList: string[]) => {
  try {
    const pluginsList: customPluginObj[] = pluginPathList.map((pluginPath) => {
      const result = require(pluginPath)
      if (result.default) {
        return result.default(babel)
      }
      return result(babel)
    })
    return getBabelPluginActuator(pluginsList)
  } catch (e) {
    console.log('获取visitor失败', e)
  }
}

export default useBabelPlugin
