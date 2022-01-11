import { declare } from '@babel/helper-plugin-utils'
import type { ImportDeclaration } from '@babel/types'
import { getImportObj } from './ASTUtils'
import type { ImportObj } from './ASTUtils'
export default declare((babel) => {
  const extra = {
    importList: <ImportObj[]>[],
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
