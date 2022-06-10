/**
 * 替换表达式的调用对象或者调用属性
 */
import { declare } from '@babel/helper-plugin-utils'
import generator from '@babel/generator'
import { getImportInfo } from './ast-utils'
import * as t from '@babel/types'
import { template } from '@babel/core'
import { NodePath } from '@babel/core'
interface ReplaceObjectInfo {
  property: string
  upLevelObjectName: string
  upLevelObjectType: 'MemberExpression' | 'ThisExpression'
  newObjectName: string
  express: string
}
interface ReplacePropertyInfo {
  property: string
  upLevelObjectName: string
  upLevelObjectType: 'MemberExpression' | 'ThisExpression'
  newProperty: string
}
const replaceObjectList: ReplaceObjectInfo[] = [
  {
    property: 'getStatus',
    newObjectName: 'czp',
    upLevelObjectName: 'pzc',
    upLevelObjectType: 'MemberExpression',
    express: `import czp from '@/utils/czp'`
  }
]
const replacePropertyList: ReplacePropertyInfo[] = [
  {
    property: 'PublicFormatter',
    newProperty: 'pzc',
    upLevelObjectName: 'this',
    upLevelObjectType: 'ThisExpression'
  }
]
export default declare((babel) => {
  let refList: string[] = []
  /**
   * 代替目标表达式对象
   * @param path
   */

  const replaceMemberExpressionObject = (path: NodePath<t.MemberExpression>) => {
    let ref = generator(path.node.property).code
    /** 是否为匹配属性 */

    const replaceObj = replaceObjectList.find((item) => item.property === ref)

    if (replaceObj) {
      const parentPath = path.parentPath

      if (
        t.isMemberExpression(parentPath.node) &&
        t.isMemberExpression(path.node.object) &&
        replaceObj.upLevelObjectType === 'MemberExpression' &&
        replaceObj.upLevelObjectName === generator(path.node.object.property).code
      ) {
        parentPath.node.object = t.identifier(replaceObj.newObjectName)
        !refList.includes(ref) && refList.push(ref)
      }

      if (
        t.isMemberExpression(parentPath.node) &&
        t.isThisExpression(path.node.object) &&
        replaceObj.upLevelObjectType === 'ThisExpression'
      ) {
        parentPath.node.object = t.identifier(replaceObj.newObjectName)
      }
    }
  }
  /**
   * 代替目标表达式属性
   * @param path
   */

  const replaceMemberExpressionProperty = (path: NodePath<t.MemberExpression>) => {
    let ref = generator(path.node.property).code
    const replaceObj = replacePropertyList.find((item) => item.property === ref)

    if (replaceObj) {
      if (
        t.isMemberExpression(path.node.object) &&
        replaceObj.upLevelObjectType === 'MemberExpression' &&
        replaceObj.upLevelObjectName === generator(path.node.object.property).code
      ) {
        path.node.property = t.identifier(replaceObj.newProperty)
      }

      if (
        t.isThisExpression(path.node.object) &&
        replaceObj.upLevelObjectType === 'ThisExpression'
      ) {
        path.node.property = t.identifier(replaceObj.newProperty)
      }
    }
  }

  return {
    name: 'ast-transform',
    visitor: {
      MemberExpression(memberExpressionPath) {
        replaceMemberExpressionObject(memberExpressionPath)
        replaceMemberExpressionProperty(memberExpressionPath)
      },

      Program: {
        exit(path) {
          if (!refList.length) {
            return
          }

          const typereplaceObjectList: t.ImportDeclaration[] = []
          const normalreplaceObjectList: t.ImportDeclaration[] = []
          const statementList: t.Statement[] = []
          path.node.body.forEach((item) => {
            if (t.isImportDeclaration(item)) {
              if (item.importKind === 'type') {
                typereplaceObjectList.push(item)
              } else {
                normalreplaceObjectList.push(item)
              }
            } else {
              statementList.push(item)
            }
          })
          const valueLocalreplaceObjectList = normalreplaceObjectList
            .map((item) => getImportInfo(item))
            .flat()

          for (const ref of refList) {
            const isExist = valueLocalreplaceObjectList.some((item) => item.localName === ref)

            if (!isExist) {
              const source = replaceObjectList.find((item) => item.property === ref)

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
          path.node.body = [...normalreplaceObjectList, ...typereplaceObjectList, ...statementList]
        }
      }
    }
  }
})
