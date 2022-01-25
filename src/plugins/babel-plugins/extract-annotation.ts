import { declare } from '@babel/helper-plugin-utils'
import type {
  FunctionDeclaration,
  ObjectMethod,
  ObjectProperty,
  VariableDeclaration
} from '@babel/types'
import type { NodePath } from '@babel/traverse'

export default declare((babel) => {
  const extra = {} as Record<string, any>
  extra.attributesObj = {} as Record<string, any>

  const getAnnatation = (
    path: NodePath<ObjectMethod | ObjectProperty | VariableDeclaration | FunctionDeclaration>
  ) => {
    if (path.node.leadingComments?.length || path.node.trailingComments?.length) {
      let key: string = ''

      switch (path.node.type) {
        case 'ObjectProperty':
        case 'ObjectMethod':
          key = path.node.key.name
          break

        case 'FunctionDeclaration':
          key = path.node.id!.name
          break

        case 'VariableDeclaration':
          key = path.node.declarations[0].id.name
          break
      }

      const comments = path.node.leadingComments || path.node.trailingComments
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

      VariableDeclaration(path) {
        getAnnatation(path)
      }
    }
  }
})
