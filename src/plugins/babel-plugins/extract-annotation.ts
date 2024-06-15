import { declare } from '@babel/helper-plugin-utils'
import * as t from '@babel/types'
import type {
  FunctionDeclaration,
  ObjectMethod,
  ObjectProperty,
  TSPropertySignature,
  VariableDeclaration
} from '@babel/types'
import type { NodePath } from '@babel/traverse'

/**
 * 提取变量注释的 Babel 插件声明。
 * 使用 @babel/helper-plugin-utils 的 declare 函数来定义插件。
 *
 * @param babel Babel 的上下文对象，提供访问 Babel 的各种工具和 API 的能力。
 * @returns 返回一个包含插件逻辑的对象，该对象必须提供 getExtra 和 visitor 属性。
 */
export default declare((babel) => {
  // 用于存储提取的注释信息。
  const extra = {} as Record<string, any>
  extra.attributesObj = {} as Record<string, any>

  /**
   * 从给定的节点路径中提取注释。
   * 支持 FunctionDeclaration、ObjectMethod、ObjectProperty、
   * VariableDeclaration 和 TSPropertySignature 类型的节点。
   *
   * @param path 节点路径，指向当前正在处理的 AST 节点。
   */
  const getAnnatation = (
    path: NodePath<
      | ObjectMethod
      | ObjectProperty
      | VariableDeclaration
      | FunctionDeclaration
      | TSPropertySignature
    >
  ) => {
    // 检查节点是否有前导或后置注释
    if (path.node.leadingComments?.length || path.node.trailingComments?.length) {
      const node = path.node
      let key: string = ''

      // 根据节点类型，提取相应的键名
      if (t.isObjectProperty(node) || t.isObjectMethod(node) || t.isTSPropertySignature(node)) {
        key = (node.key as t.Identifier).name || (node.key as t.StringLiteral).value
      }
      if (t.isFunctionDeclaration(node) && node.id) {
        key = node.id.name
      }
      if (t.isVariableDeclaration(node)) {
        key = (node.declarations[0].id as t.Identifier).name
      }

      // 提取并处理注释文本
      const comments = node.leadingComments || node.trailingComments
      const annotation = comments?.map((item) => item.value).join(',')

      // 如果存在注释且键名不为空，则存储处理后的注释文本
      if (annotation?.length && key) {
        extra.attributesObj[key] = annotation.replace(/ +\*/g, '').replace(/[\r\n]/g, '')
      }
    }
  }

  // 返回插件需要提供的额外信息和访问器
  return {
    getExtra() {
      return extra
    },
    name: 'ast-transform',
    visitor: {
      // 定义访问器处理不同类型的 AST 节点
      FunctionDeclaration(path) {
        getAnnatation(path)
      },
      ObjectMethod(path) {
        getAnnatation(path)
      },
      ObjectProperty(path) {
        getAnnatation(path)
      },
      TSPropertySignature(path) {
        getAnnatation(path)
      },
      VariableDeclaration(path) {
        getAnnatation(path)
      }
    }
  }
})
