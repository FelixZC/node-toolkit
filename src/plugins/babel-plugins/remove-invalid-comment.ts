import { declare } from '@babel/helper-plugin-utils'
/**
 * @deprecated
 * 移除包含this的无效代码
 * 声明一个AST（抽象语法树）转换插件。
 * @param babel Babel实例，提供转换环境和工具。
 * @return 返回一个定义了转换规则的对象。
 */
export default declare((babel) => {
  return {
    name: 'ast-transform', // 插件名称。
    visitor: {
      // 针对BlockStatement节点的访问器。
      BlockStatement(path, state) {
        // 检查并移除包含特定字符串的前导注释。
        if (path.node.leadingComments && path.node.leadingComments.length) {
          for (const comments of path.node.leadingComments) {
            if (comments.value.includes('this.')) {
              path.node.leadingComments = null
            }
          }
        }

        // 检查并移除包含特定字符串的尾随注释。
        if (path.node.trailingComments && path.node.trailingComments.length) {
          for (const comments of path.node.trailingComments) {
            if (comments.value.includes('this.')) {
              path.node.trailingComments = null
            }
          }
        }

        // 检查并移除包含特定字符串的内部注释。
        if (path.node.innerComments && path.node.innerComments.length) {
          for (const comments of path.node.innerComments) {
            if (comments.value.includes('this.')) {
              path.node.innerComments = null
            }
          }
        }
      },

      // 针对Identifier节点的访问器。
      Identifier(path, state) {
        // 查找包含当前节点的最近的父节点，该父节点可能拥有注释。
        const parent = path.findParent(
          (path) =>
            path.node &&
            (!!path.node.leadingComments ||
              !!path.node.trailingComments ||
              !!path.node.innerComments)
        )

        if (parent) {
          // 对父节点的前导注释进行相同的检查和移除操作。
          if (parent.node.leadingComments && parent.node.leadingComments.length) {
            for (const comments of parent.node.leadingComments) {
              if (comments.value.includes('this.')) {
                parent.node.leadingComments = null
              }
            }
          }

          // 对父节点的尾随注释进行相同的检查和移除操作。
          if (parent.node.trailingComments && parent.node.trailingComments.length) {
            for (const comments of parent.node.trailingComments) {
              if (comments.value.includes('this.')) {
                parent.node.trailingComments = null
              }
            }
          }

          // 对父节点的内部注释进行相同的检查和移除操作。
          if (parent.node.innerComments && parent.node.innerComments.length) {
            for (const comments of parent.node.innerComments) {
              if (comments.value.includes('this.')) {
                parent.node.innerComments = null
              }
            }
          }
        }
      }
    }
  }
})
