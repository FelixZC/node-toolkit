import { declare } from '@babel/helper-plugin-utils'
export default declare((babel) => {
  const { types: t } = babel
  return {
    name: 'ast-transform',
    // not required
    visitor: {
      Identifier(path, state) {
        const parent = path.findParent(
          (path) => path.node && path.node.trailingComments
        )

        if (parent && parent.inList && parent.type === 'ObjectProperty') {
          if (!parent.node.leadingComments && parent.node.trailingComments) {
            parent.node.leadingComments = parent.node.trailingComments
            parent.node.trailingComments = null
          }
        }
      },
    },
  }
})
