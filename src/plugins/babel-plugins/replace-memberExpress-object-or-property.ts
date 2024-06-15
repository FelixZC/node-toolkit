import { declare } from '@babel/helper-plugin-utils'
import generator from '@babel/generator'
import { getImportInfo } from './ast-utils'
import * as t from '@babel/types'
import { template } from '@babel/core'
import type { NodePath } from '@babel/traverse'
interface ReplaceObjectInfo {
  property: string
  upLevelObjectName: string
  upLevelObjectType: 'MemberExpression' | 'ThisExpression'
  newObjectName: string
  express?: string
}
interface ReplacePropertyInfo {
  property: string
  upLevelObjectName: string
  upLevelObjectType: 'MemberExpression' | 'ThisExpression'
  newProperty: string
}
/**
 * @deprecated
 * 替换表达式的调用对象或者调用属性
 * 该函数为一个AST（抽象语法树）转换插件的声明函数。
 * 使用babel和提供的选项对JavaScript代码的AST进行转换。
 *
 * @param babel Babel实例，用于访问Babel的功能。
 * @param options 包含转换配置的对象。
 *    - replaceObjectList: 替换对象列表，用于查找并替换特定的对象。
 *    - replacePropertyList: 替换属性列表，用于查找并替换特定的属性。
 * @returns 返回一个AST转换插件的对象。
 */
export default declare(
  (
    babel,
    options: {
      replaceObjectList: ReplaceObjectInfo[]
      replacePropertyList: ReplacePropertyInfo[]
    }
  ) => {
    //替换引用对象
    let refList: string[] = []

    /**
     * 代替目标表达式对象。
     * 在AST中查找并替换指定的对象。
     *
     * @param path 表示MemberExpression节点的路径。
     */
    const replaceMemberExpressionObject = (path: NodePath<t.MemberExpression>) => {
      let ref = generator(path.node.property).code
      /** 是否为匹配属性 */

      const replaceObj = (options.replaceObjectList || []).find((item) => item.property === ref)
      if (replaceObj) {
        const parentPath = path.parentPath

        // 如果满足特定条件，则替换父节点的对象。
        if (
          t.isMemberExpression(parentPath.node) &&
          t.isMemberExpression(path.node.object) &&
          replaceObj.upLevelObjectType === 'MemberExpression' &&
          replaceObj.upLevelObjectName === generator(path.node.object.property).code
        ) {
          parentPath.node.object = t.identifier(replaceObj.newObjectName)
          !refList.includes(ref) && refList.push(ref)
        }

        // 如果满足特定条件，则直接替换当前节点的对象。
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
     * 代替目标表达式属性。
     * 在AST中查找并替换指定的属性。
     *
     * @param path 表示MemberExpression节点的路径。
     */
    const replaceMemberExpressionProperty = (path: NodePath<t.MemberExpression>) => {
      let ref = generator(path.node.property).code
      const replaceObj = (options.replacePropertyList || []).find((item) => item.property === ref)
      if (replaceObj) {
        // 如果满足特定条件，则替换节点的属性。
        if (
          t.isMemberExpression(path.node.object) &&
          replaceObj.upLevelObjectType === 'MemberExpression' &&
          replaceObj.upLevelObjectName === generator(path.node.object.property).code
        ) {
          path.node.property = t.identifier(replaceObj.newProperty)
        }

        // 如果满足特定条件，则直接替换当前节点的属性。
        if (
          t.isThisExpression(path.node.object) &&
          replaceObj.upLevelObjectType === 'ThisExpression'
        ) {
          path.node.property = t.identifier(replaceObj.newProperty)
        }
      }
    }

    // 返回AST转换插件的具体实现。
    return {
      name: 'ast-transform',
      visitor: {
        MemberExpression(memberExpressionPath) {
          replaceMemberExpressionObject(memberExpressionPath)
          replaceMemberExpressionProperty(memberExpressionPath)
        },
        Program: {
          exit(path) {
            // 如果没有需要替换的引用，则直接返回。
            if (!refList.length) {
              return
            }

            // 分类处理导入声明。
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

            // 处理动态导入。
            const valueLocalreplaceObjectList = normalreplaceObjectList
              .map((item) => getImportInfo(item))
              .flat()
            for (const ref of refList) {
              const isExist = valueLocalreplaceObjectList.some((item) => item.localName === ref)

              // 如果没有找到对应的导入声明，则根据replaceObjectList添加新的导入声明。
              if (!isExist) {
                const source = (options.replaceObjectList || []).find(
                  (item) => item.property === ref
                )
                if (source && source.express) {
                  const newImport = template(source.express)()

                  // 将新的导入声明添加到代码块的开始。
                  if (Array.isArray(newImport)) {
                    statementList.unshift(...newImport)
                  } else {
                    statementList.unshift(newImport)
                  }
                }
              }
            }
            refList = []
            // 更新AST的body部分。
            path.node.body = [
              ...normalreplaceObjectList,
              ...typereplaceObjectList,
              ...statementList
            ]
          }
        }
      }
    }
  }
)
