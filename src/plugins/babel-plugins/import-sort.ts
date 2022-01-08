import { declare } from '@babel/helper-plugin-utils'
export default declare((babel) => {
  const { types: t } = babel
  return {
    name: 'ast-transform', // not required
    visitor: {
      Program: {
        exit(path) {
          let improtList = path.node.body.filter((i) => i.type === 'ImportDeclaration')
          const otherList = path.node.body.filter((i) => i.type !== 'ImportDeclaration')
          const importObjList = []
          for (const item of improtList) {
            const importObj = {
              source: '',
              defaultImportName: '',
              importNameList: [],
              namespace: ''
            }
            for (const specifier of item.specifiers) {
              if (specifier.type === 'ImportDefaultSpecifier') {
                importObj.defaultImportName = specifier.local.name
              }
              if (specifier.type === 'ImportSpecifier') {
                if (specifier.imported.name === specifier.local.name) {
                  importObj.importNameList.push(specifier.imported.name)
                } else {
                  importObj.importNameList.push(
                    `${specifier.imported.name} as ${specifier.local.name}`
                  )
                }
              }
              if (specifier.type === 'ImportNamespaceSpecifier') {
                importObj.namespace = specifier.local.name
              }
            }
            const defaultOrNamespaceList = item.specifiers.filter(
              (item) => item.type !== 'ImportSpecifier'
            )
            //解构排序
            const ImportSpecifierList = item.specifiers
              .filter((item) => item.type === 'ImportSpecifier')
              .sort((v1, v2) => {
                const v1Name = v1.imported.name
                const v2Name = v2.imported.name
                return v1Name.localeCompare(v2Name)
              })
            item.specifiers = [...defaultOrNamespaceList, ...ImportSpecifierList]
            importObj.source = item.source.value
            importObjList.push(importObj)
          }
          //默认导出排序
          improtList = improtList.sort((v1, v2) => {
            const v1ImportObj = importObjList.find((item) => item.source === v1.source.value)
            const v1DefaultImportName =
              v1ImportObj.defaultImportName || v1ImportObj.namespace || '@'
            const v2ImportObj = importObjList.find((item) => item.source === v2.source.value)
            const v2DefaultImportName =
              v2ImportObj.defaultImportName || v2ImportObj.namespace || '@'
            return v1DefaultImportName.localeCompare(v2DefaultImportName)
          })

          path.node.body = [...improtList, ...otherList]
        }
      }
    }
  }
}
)
