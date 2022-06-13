/**
 * 导入排序
 */
import { declare } from '@babel/helper-plugin-utils'
import { getImportInfo } from './ast-utils'
import * as t from '@babel/types'
export default declare((babel) => {
  const sortImport = (importList: t.ImportDeclaration[]) => {
    /** 先对导入导出名称进行排序 */
    importList.forEach((importItem) => {
      importItem.specifiers.sort((v1, v2) => {
        let v1Name = v1.local.name
        let v2Name = v2.local.name

        if (t.isImportDefaultSpecifier(v1) || t.isImportNamespaceSpecifier(v1)) {
          return -1
        }

        if (t.isImportDefaultSpecifier(v2) || t.isImportNamespaceSpecifier(v2)) {
          return 1
        }

        if (t.isImportSpecifier(v1)) {
          if (t.isIdentifier(v1.imported)) {
            v1Name = v1.imported.name
          } else {
            v1Name = v1.imported.value
          }
        }

        if (t.isImportSpecifier(v2)) {
          if (t.isIdentifier(v2.imported)) {
            v2Name = v2.imported.name
          } else {
            v2Name = v2.imported.value
          }
        }

        return v1Name.localeCompare(v2Name)
      })
    })
    const importInfoList = importList.map((importItem) => {
      return getImportInfo(importItem)
    })
    importList.sort((v1, v2) => {
      const v1ImportInfo = importInfoList.find(
        (importObjList) => importObjList[0].source === v1.source.value
      )
      const v2ImportInfo = importInfoList.find(
        (importObjList) => importObjList[0].source === v2.source.value
      )

      if (!v1ImportInfo || !v2ImportInfo) {
        return 0
      }
      /** 默认值 */

      let v1Name = '@'
      let v2Name = '@'
      /** 如果存在默认导入，按默认导入排序 */

      if (v1ImportInfo.length > 1) {
        const target = v1ImportInfo.find((item) => item.importedName)

        if (target) {
          v1Name = target.importedName!
        }
      }

      if (v2ImportInfo.length > 1) {
        const target = v2ImportInfo.find((item) => item.importedName)

        if (target) {
          v2Name = target.importedName!
        }
      }

      v1Name = v1ImportInfo[0].localName
      v2Name = v2ImportInfo[0].localName
      return v1Name.localeCompare(v2Name)
    })
  }

  return {
    name: 'ast-transform',
    visitor: {
      Program: {
        exit(path) {
          try {
            const typeImportList: t.ImportDeclaration[] = []
            const normalImportList: t.ImportDeclaration[] = []
            const statementList: t.Statement[] = []
            /** 分类 */

            path.node.body.forEach((item) => {
              if (t.isImportDeclaration(item)) {
                if (item.importKind === 'type') {
                  typeImportList.push(item)
                } else {
                  normalImportList.push(item)
                }
              } else {
                statementList.push(item)
              }
            })
            sortImport(normalImportList)
            sortImport(typeImportList)
            path.node.body = [...normalImportList, ...typeImportList, ...statementList]
          } catch (e) {
            console.log(e)
          }
        }
      }
    }
  }
})
