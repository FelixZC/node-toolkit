/**
 * 提取变量注释
 */
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
export default declare((babel) => {
  const extra = {} as Record<string, any>
  extra.attributesObj = {} as Record<string, any>

  const getAnnatation = (
    path: NodePath<
      | ObjectMethod
      | ObjectProperty
      | VariableDeclaration
      | FunctionDeclaration
      | TSPropertySignature
    >
  ) => {
    if (path.node.leadingComments?.length || path.node.trailingComments?.length) {
      const node = path.node
      let key: string = ''

      if (t.isObjectProperty(node) || t.isObjectMethod(node) || t.isTSPropertySignature(node)) {
        key = (node.key as t.Identifier).name || (node.key as t.StringLiteral).value
      }

      if (t.isFunctionDeclaration(node) && node.id) {
        key = node.id.name
      }

      if (t.isVariableDeclaration(node)) {
        key = (node.declarations[0].id as t.Identifier).name
      }

      const comments = node.leadingComments || node.trailingComments
      const annotation = comments?.map((item) => item.value).join(',')

      if (annotation?.length && key) {
        extra.attributesObj[key] = annotation.replace(/ +\*/g, '').replace(/[\r\n]/g, '')
      }
    }
  }

  return {
    getExtra() {
      return extra
    },

    name: 'ast-transform',
    visitor: {
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
