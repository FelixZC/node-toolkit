import * as compiler from '@vue/compiler-sfc'
import { createRoot, generate } from '@vue/compiler-core'
// import { RootNode, NodeTypes, createSimpleExpression, locStub } from '@vue/compiler-core'
// import * as generator from '@babel/generator'
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
// function createRoot(options: Partial<RootNode> = {}): RootNode {
//   return {
//     type: NodeTypes.ROOT,
//     children: [],
//     helpers: [],
//     components: [],
//     directives: [],
//     imports: [],
//     hoists: [],
//     cached: 0,
//     temps: 0,
//     codegenNode: createSimpleExpression(`null`, false),
//     loc: locStub,
//     ...options
//   }
// }

import { stringify } from '../sfc-utils'
import { writeFile } from '../../utils/common'
import type { ExecFileInfo } from '../common'
import type { SFCParseOptions } from '@vue/compiler-sfc'

/**
 * 将Vue单文件组件的信息转换为JSON格式字符串。
 * @param fileInfo 包含组件源码信息的对象。
 * @param option 解析Vue文件时的选项（可选）。
 * @returns 返回转换后的Vue组件描述信息的JSON字符串。
 */
const transferNodePropertyToJson = (fileInfo: ExecFileInfo, option?: SFCParseOptions) => {
  // 使用Vue编译器解析组件文件
  const vue = compiler.parse(fileInfo.source, option)

  // 如果存在模板部分，则将其AST转换为JSON，并写入文件
  if (vue.descriptor.template) {
    const rootNode = createRoot([vue.descriptor.template.ast])
    const generateResult = generate(rootNode)
    // 将模板AST和生成的结果写入文件以供查看
    writeFile('src/query/sfc/rootNode.json', JSON.stringify(rootNode, null, 2))
    writeFile('src/query/sfc/generateResult.json', JSON.stringify(generateResult, null, 2))
  }

  // 将完整的Vue解析结果写入JSON文件
  writeFile('src/query/sfc/vue.json', JSON.stringify(vue, null, 2)) //TODO 遍历template.ast，修改ast，修改对应script代码， 转化为posthtml-render可输入ast?，输出新template

  // 返回Vue组件的字符串描述
  return stringify(vue.descriptor)
}

export default transferNodePropertyToJson
