import { declare } from '@babel/helper-plugin-utils'
export default declare((babel) => {
  const { types: t } = babel
  return {
    name: 'ast-transform',
    // not required
    visitor: {
      Identifier(path, state) {
        const parent = path.findParent(
          (path) => path.node && path.node.leadingComments
        )

        if (parent && parent.inList && parent.type === 'ObjectProperty') {
          const sibling = parent.getSibling(parent.key - 1)

          if (
            sibling.node &&
            !sibling.node.leadingComments &&
            !sibling.node.trailingComments &&
            !sibling.node.innerComments
          ) {
            sibling.node.leadingComments = parent.node.leadingComments
            parent.node.leadingComments = null
          }
        }
      },
    },
  }
})
