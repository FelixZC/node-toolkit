import * as compiler from '@vue/compiler-sfc'
import { writeFile } from '../../utils/common'
import type { ExecFileInfo } from '../common' // import * as generator from '@babel/generator'
// import * as parser from '@babel/parser'
// import * as t from '@babel/types'
// import * as traverse from '@babel/traverse'
// import { NodePath } from '@babel/traverse'
// import type { AttributeNode, ElementNode, TemplateChildNode } from '@vue/compiler-core'
// import { getParserOption } from '../babel-plugins/ast-utils'
// export declare const enum NodeTypes {
//   ROOT = 0,
//   ELEMENT = 1,
//   TEXT = 2,
//   COMMENT = 3,
//   SIMPLE_EXPRESSION = 4,
//   INTERPOLATION = 5,
//   ATTRIBUTE = 6,
//   DIRECTIVE = 7,
//   COMPOUND_EXPRESSION = 8,
//   IF = 9,
//   IF_BRANCH = 10,
//   FOR = 11,
//   TEXT_CALL = 12,
//   VNODE_CALL = 13,
//   JS_CALL_EXPRESSION = 14,
//   JS_OBJECT_EXPRESSION = 15,
//   JS_PROPERTY = 16,
//   JS_ARRAY_EXPRESSION = 17,
//   JS_FUNCTION_EXPRESSION = 18,
//   JS_CONDITIONAL_EXPRESSION = 19,
//   JS_CACHE_EXPRESSION = 20,
//   JS_BLOCK_STATEMENT = 21,
//   JS_TEMPLATE_LITERAL = 22,
//   JS_IF_STATEMENT = 23,
//   JS_ASSIGNMENT_EXPRESSION = 24,
//   JS_SEQUENCE_EXPRESSION = 25,
//   JS_RETURN_STATEMENT = 26
// }

import type { SFCParseOptions } from '@vue/compiler-sfc'

const transferNodePropertyToJson = (fileInfo: ExecFileInfo, option?: SFCParseOptions) => {
  const vue = compiler.parse(fileInfo.source, option)
  const styles = vue.descriptor.styles
  const compileTemplateResult = compiler.compileTemplate({
    source: vue.descriptor.template?.content || '',
    filename: vue.descriptor.filename,
    id: 'pzc'
  })
  const compileScriptResult = compiler.compileScript(vue.descriptor, {
    id: 'pzc'
  })
  const compileStyleResult = styles.map((style) => {
    return compiler.compileStyle({
      source: style.content,
      filename: vue.descriptor.filename,
      id: 'pzc'
    })
  })
  writeFile('src/query/sfc/vue.json', JSON.stringify(vue, null, 2))
  writeFile('src/query/sfc/template.json', JSON.stringify(vue.descriptor.template, null, 2))
  writeFile('src/query/sfc/script.json', JSON.stringify(vue.descriptor.script, null, 2))
  writeFile('src/query/sfc/scriptSetup.json', JSON.stringify(vue.descriptor.scriptSetup, null, 2))
  writeFile('src/query/sfc/styles.json', JSON.stringify(vue.descriptor.styles, null, 2))
  writeFile(
    'src/query/sfc/compileTemplateResult.json',
    JSON.stringify(compileTemplateResult, null, 2)
  )
  writeFile('src/query/sfc/compileScriptResult.json', JSON.stringify(compileScriptResult, null, 2))
  writeFile('src/query/sfc/compileStyleResult.json', JSON.stringify(compileStyleResult, null, 2))
  return ''
}

export default transferNodePropertyToJson
