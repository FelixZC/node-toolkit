import { declare } from '@babel/helper-plugin-utils'
import type {
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
} from '@babel/types'
import { getImportObj } from './ASTUtils'

const sortImportSpecifiers = (item: ImportDeclaration) => {
  const defaultOrNamespaceList:
    | ImportDefaultSpecifier[]
    | ImportNamespaceSpecifier[] = []
  const importSpecifierTypeList: ImportSpecifier[] = []
  const importSpecifierList: ImportSpecifier[] = []
  item.specifiers.forEach((specifier) => {
    switch (true) {
      case specifier.type !== 'ImportSpecifier':
        defaultOrNamespaceList.push(
          specifier as ImportDefaultSpecifier | ImportNamespaceSpecifier
        )
        break
      case specifier.type === 'ImportSpecifier' &&
        specifier.importKind === 'type':
        importSpecifierTypeList.push(specifier as ImportSpecifier)
      default:
        importSpecifierList.push(specifier as ImportSpecifier)
    }
  })

  importSpecifierList.sort((v1, v2) => {
    const v1Name =
      v1.imported.type === 'Identifier' ? v1.imported.name : v1.imported.value
    const v2Name =
      v2.imported.type === 'Identifier' ? v2.imported.name : v2.imported.value
    return v1Name.localeCompare(v2Name)
  })
  importSpecifierTypeList.sort((v1, v2) => {
    const v1Name =
      v1.imported.type === 'Identifier' ? v1.imported.name : v1.imported.value
    const v2Name =
      v2.imported.type === 'Identifier' ? v2.imported.name : v2.imported.value
    return v1Name.localeCompare(v2Name)
  })
  item.specifiers = [
    ...defaultOrNamespaceList,
    ...importSpecifierList,
    ...importSpecifierTypeList,
  ]
  return item
}

const sortImport = (importList: ImportDeclaration[]) => {
  const customImportObjList = getImportObj(importList)
  importList.sort((v1, v2) => {
    const v1ImportObj = customImportObjList.find(
      (item) => item.source === v1.source.value
    )
    const v2ImportObj = customImportObjList.find(
      (item) => item.source === v2.source.value
    )
    if (!v1ImportObj || !v2ImportObj) {
      return 0
    }
    const v1DefaultImportName =
      v1ImportObj.defaultImportName || v1ImportObj.namespace || '@'

    const v2DefaultImportName =
      v2ImportObj.defaultImportName || v2ImportObj.namespace || '@'
    return v1DefaultImportName.localeCompare(v2DefaultImportName)
  })
}

export default declare((babel) => {
  return {
    name: 'ast-transform',
    visitor: {
      Program: {
        exit(path) {
          let importList = path.node.body.filter(
            (i) => i.type === 'ImportDeclaration'
          ) as ImportDeclaration[]
          const otherList = path.node.body.filter(
            (i) => i.type !== 'ImportDeclaration'
          )
          for (const item of importList) {
            sortImportSpecifiers(item)
          }
          sortImport(importList)
          path.node.body = [...importList, ...otherList]
        },
      },
    },
  }
})
