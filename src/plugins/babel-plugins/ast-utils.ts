import type { ImportDeclaration } from '@babel/types'

export interface ImportObj {
  defaultImportName: string
  importNameList: string[]
  namespace: string
  source: string
  kind?: string | null | undefined
}
export const getImportObj = (importList: ImportDeclaration[]) => {
  const customImportObjList: ImportObj[] = []

  for (const item of importList) {
    const importObj: ImportObj = {
      defaultImportName: '',
      importNameList: [],
      kind: '',
      namespace: '',
      source: ''
    }

    for (const specifier of item.specifiers) {
      switch (specifier.type) {
        case 'ImportDefaultSpecifier':
          importObj.defaultImportName = specifier.local.name
          break

        case 'ImportSpecifier':
          const importName =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value

          if (importName === specifier.local.name) {
            importObj.importNameList.push(importName)
          } else {
            importObj.importNameList.push(`${importName} as ${specifier.local.name}`)
          }

          break

        case 'ImportNamespaceSpecifier':
          importObj.namespace = specifier.local.name
          break
      }
    }

    importObj.source = item.source.value
    importObj.kind = item.importKind
    customImportObjList.push(importObj)
  }

  return customImportObjList
}
