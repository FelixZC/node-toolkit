import { declare } from '@babel/helper-plugin-utils'
import type { ImportDeclaration } from '@babel/types'
import { isPath, transferRef } from '../../utils/common'

export default declare((babel) => {
  return {
    name: 'ast-transform',
    visitor: {
      //暂时不考虑复杂引用
      StringLiteral(path) {
        if (isPath(path.node.value)) {
          path.node.value = transferRef(path.node.value)
        }
      },
      Program: {
        enter(path) {
          const importList = path.node.body.filter(
            (i) => i.type === 'ImportDeclaration'
          ) as ImportDeclaration[]
          const otherList = path.node.body.filter((i) => i.type !== 'ImportDeclaration')
          const importListMap = importList.map((item) => {
            if (isPath(item.source.value)) {
              item.source.value = transferRef(item.source.value)
            }

            return {
              ...item
            }
          })
          path.node.body = [...importListMap, ...otherList]
        }
      }
    }
  }
})
