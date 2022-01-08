import { declare } from '@babel/helper-plugin-utils'
export default declare((babel) => {
  const { types: t } = babel
  const extra = {} as Record<string, any>
  extra.attributesObj = {} as Record<string, any>
  return {
    name: 'ast-transform', // not required
    visitor: {
      Identifier(path) {
        const parent = path.findParent((path) => {
          const isTarget =
            path.isObjectMethod() || path.isObjectProperty() || path.isVariableDeclaration()
          if (isTarget && path.node.leadingComments?.length) {
            return true
          }
          return false
        })
        if (parent) {
          const key = path.node.name
          const comments = parent.node.leadingComments || parent.node.trailingComments
          const annotation = comments?.map((item) => item.value).join(',')
          if (annotation) {
            extra.attributesObj[key] = annotation
          }
        }
      }
    },
    getExtra() {
      return extra
    }
  }
})
