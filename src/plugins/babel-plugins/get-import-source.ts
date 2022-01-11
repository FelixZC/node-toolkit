import { declare } from '@babel/helper-plugin-utils'
import { getImportObj } from './ASTUtils'
import type { ImportDeclaration } from '@babel/types'
import type { ImportObj } from './ASTUtils'
export default declare((babel) => {
  const extra = {
    importList: [] as ImportObj[],
  } as Record<string, any>
  return {
    getExtra() {
      return extra
    },

    name: 'ast-transform',
    visitor: {
      Program: {
        exit(path) {
          const importList = path.node.body.filter(
            (i) => i.type === 'ImportDeclaration'
          ) as ImportDeclaration[]
          extra.importList = getImportObj(importList)
        },
      },
    },
  }
})
