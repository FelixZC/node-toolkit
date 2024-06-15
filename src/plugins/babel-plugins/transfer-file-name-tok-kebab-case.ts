import { declare } from '@babel/helper-plugin-utils'
import { isPath, transferRef } from '../../utils/common'

/**
 * @deprecated
 * 变更驼峰命名
 * 定义一个插件，用于转换AST（抽象语法树）。
 * @param babel Babel对象，提供插件运行时的环境和工具。
 * @returns 返回一个对象，包含插件的名字和访问器（visitor），用于指定如何处理AST中的特定节点。
 */
export default declare((babel) => {
  return {
    name: 'ast-transform',
    // 插件名称。
    visitor: {
      // 处理ImportDeclaration节点，即导入声明。
      ImportDeclaration(path) {
        // 如果导入路径满足特定条件，则转换路径。
        if (isPath(path.node.source.value)) {
          path.node.source.value = transferRef(path.node.source.value)
        }
      },
      // 处理StringLiteral节点，即字符串字面量。
      StringLiteral(path) {
        // 如果字符串值满足特定条件，则转换该值。
        if (isPath(path.node.value)) {
          path.node.value = transferRef(path.node.value)
        }
      }
    }
  }
})
