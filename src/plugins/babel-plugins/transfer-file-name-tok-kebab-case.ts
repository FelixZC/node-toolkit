import { declare } from '@babel/helper-plugin-utils'
import { isPath, transferRef } from '../../utils/common'
export default declare((babel) => {
  return {
    name: 'ast-transform',
    visitor: {
      ImportDeclaration(path) {
        if (isPath(path.node.source.value)) {
          path.node.source.value = transferRef(path.node.source.value)
        }
      },
      StringLiteral(path) {
        if (isPath(path.node.value)) {
          path.node.value = transferRef(path.node.value)
        }
      }
    }
  }
})
