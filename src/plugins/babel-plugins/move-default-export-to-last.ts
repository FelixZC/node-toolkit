import { declare } from '@babel/helper-plugin-utils'
import * as t from '@babel/types'
/**
 * 移动默认导出到最后
 * 定义一个AST（抽象语法树）转换插件。
 * @param babel Babel实例，提供转换所需的上下文和工具。
 * @return 返回一个描述转换规则的对象。
 */
export default declare((babel) => {
  return {
    name: 'ast-transform', // 插件名称。
    visitor: {
      // 访问器，指定需要转换的AST节点类型。
      Program: {
        // 当遍历到Program节点时的处理逻辑。
        exit(path) {
          // 找到默认导出声明的索引。
          const defaultExportIndex = path.node.body.findIndex((item) =>
            t.isExportDefaultDeclaration(item)
          )

          // 如果存在默认导出且不在代码块的最后，则移动到末尾。
          if (defaultExportIndex > -1 && defaultExportIndex !== path.node.body.length - 1) {
            const node = path.node.body[defaultExportIndex] // 获取默认导出节点。
            path.node.body.splice(defaultExportIndex, 1) // 从原位置移除。
            path.node.body.push(node) // 将默认导出节点移到代码块末尾。
          }
        }
      }
    }
  }
})
