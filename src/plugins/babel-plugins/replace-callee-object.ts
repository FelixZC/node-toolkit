/**
 * 替换成员表达式中的this调用
 */
import { declare } from '@babel/helper-plugin-utils'
import * as t from '@babel/types'
import { getImportInfo } from './ast-utils'
import { template } from '@babel/core'
import { NodePath } from '@babel/core'

export default declare((babel) => {
  const importList = []
  let refList: string[] = []
  const replaceMemberExpressionObject = (path: NodePath<t.MemberExpression>, depth: number) => {
    path.traverse({
      ThisExpression(ThisExpressionPath) {
        let parentPath: NodePath | null | undefined = ThisExpressionPath
        //嵌套几层就向上查找几层
        for (let index = 1; index < depth; index++) {
          parentPath = parentPath?.parentPath
        }
        if (parentPath && t.isMemberExpression(parentPath.node)) {
          let ref = ''
          const property = parentPath.node.property
          if (t.isIdentifier(property)) {
            ref = property.name
          }
          if (t.isStringLiteral(property)) {
            ref = property.value
          }
          const isExistObj = importList.find((item) => item.local === ref)
          if (isExistObj) {
            path.node.object = property as t.Identifier | t.StringLiteral
            !refList.includes(ref) && refList.push(ref)
          }
        }
      }
    })
  }
  return {
    name: 'ast-transform',
    visitor: {
      MemberExpression(memberExpressionPath) {
        replaceMemberExpressionObject(memberExpressionPath, 3)
      },
      Program: {
        exit(path) {
          const typeImportList: t.ImportDeclaration[] = []
          const normalImportList: t.ImportDeclaration[] = []
          const statementList: t.Statement[] = []
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
          const valueLocalImportList = normalImportList.map((item) => getImportInfo(item)).flat()
          for (const ref of refList) {
            const isExist = valueLocalImportList.some((item) => item.localName === ref)
            if (!isExist) {
              const source = importList.find((item) => item.local === ref)
              if (source) {
                const newImport = template(source.express)()
                if (Array.isArray(newImport)) {
                  statementList.unshift(...newImport)
                } else {
                  statementList.unshift(newImport)
                }
              }
            }
          }
          refList = []
          path.node.body = [...normalImportList, ...typeImportList, ...statementList]
        }
      }
    }
  }
})
