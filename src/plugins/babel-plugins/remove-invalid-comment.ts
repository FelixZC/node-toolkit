import { declare } from '@babel/helper-plugin-utils'
export default declare((babel) => {
  const { types: t } = babel
  return {
    name: 'ast-transform',

    // not required
    visitor: {
      BlockStatement(path, state) {
        if (path.node.leadingComments && path.node.leadingComments.length) {
          for (const comments of path.node.leadingComments) {
            if (comments.value.includes('this.')) {
              path.node.leadingComments = null
            }
          }
        }

        if (path.node.trailingComments && path.node.trailingComments.length) {
          for (const comments of path.node.trailingComments) {
            if (comments.value.includes('this.')) {
              path.node.trailingComments = null
            }
          }
        }

        if (path.node.innerComments && path.node.innerComments.length) {
          for (const comments of path.node.innerComments) {
            if (comments.value.includes('this.')) {
              path.node.innerComments = null
            }
          }
        }
      },

      Identifier(path, state) {
        const parent = path.findParent(
          (path) =>
            path.node &&
            (!!path.node.leadingComments ||
              !!path.node.trailingComments ||
              !!path.node.innerComments)
        )

        if (parent) {
          if (
            parent.node.leadingComments &&
            parent.node.leadingComments.length
          ) {
            for (const comments of parent.node.leadingComments) {
              if (comments.value.includes('this.')) {
                parent.node.leadingComments = null
              }
            }
          }

          if (
            parent.node.trailingComments &&
            parent.node.trailingComments.length
          ) {
            for (const comments of parent.node.trailingComments) {
              if (comments.value.includes('this.')) {
                parent.node.trailingComments = null
              }
            }
          }

          if (parent.node.innerComments && parent.node.innerComments.length) {
            for (const comments of parent.node.innerComments) {
              if (comments.value.includes('this.')) {
                parent.node.innerComments = null
              }
            }
          }
        }
      },
    },
  }
})
