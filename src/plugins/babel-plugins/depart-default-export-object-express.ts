/**
 * 分离默认导出对象方法，添加单独引用，聚合默认导出
 */
import { declare } from '@babel/helper-plugin-utils'
import * as t from '@babel/types'
import { cloneDeep } from 'lodash'
// import { NodePath } from '@babel/core'
export default declare((babel) => {
  /** 默认导出拆分记录记录 */
  const objectMethodList: t.ObjectMethod[] = []
  /** 重定义方法变量记录 */
  const tranferExportList: string[] = []
  /** 已经导出的方法和变量 */
  const alreadyExportList: string[] = []
  return {
    name: 'ast-transform',
    visitor: {
      /** 拆分默认导出对象方法，只为对象属性，并记录 */
      ExportDefaultDeclaration(path) {
        if (t.isObjectExpression(path.node.declaration)) {
          path.traverse({
            ObjectMethod(path) {
              objectMethodList.push(cloneDeep(path.node))
              const key =
                (path.node.key as t.Identifier).name || (path.node.key as t.StringLiteral).value
              path.replaceWith(t.objectProperty(t.identifier(key), t.identifier(key), false, true))
              path.node.trailingComments = null
              path.node.leadingComments = null
            }
          })
        }
      },
      Program: {
        enter(path) {
          /** 方法和变量重置导出，并记录 */
          for (let index = 0; index < path.node.body.length; index++) {
            const element = path.node.body[index]
            /** 方法定义 */
            if (t.isFunctionDeclaration(element)) {
              if (element.id) {
                const node = t.exportNamedDeclaration(
                  t.functionDeclaration(
                    element.id,
                    element.params,
                    element.body,
                    element.generator,
                    element.async
                  )
                )
                node.leadingComments = element.leadingComments
                node.trailingComments = element.trailingComments
                path.node.body[index] = node
                tranferExportList.push(element.id.name)
              }
            }
            /** 变量定义 */
            if (t.isVariableDeclaration(element)) {
              const node = t.exportNamedDeclaration(
                t.variableDeclaration(element.kind, element.declarations)
              )
              node.leadingComments = element.leadingComments
              node.trailingComments = element.trailingComments
              path.node.body[index] = node
              element.declarations.forEach((item) => {
                if (t.isIdentifier(item.id)) {
                  tranferExportList.push(item.id.name)
                }
              })
            }
            /** 查找已导出方法和变量记录 */
            if (t.isExportNamedDeclaration(element)) {
              /** 已导出变量定义 */
              if (t.isVariableDeclaration(element.declaration)) {
                element.declaration.declarations.forEach((item) => {
                  if (t.isIdentifier(item.id)) {
                    alreadyExportList.push(item.id.name)
                  }
                })
              }
              /** 已导出方法定义 */
              if (t.isFunctionDeclaration(element.declaration)) {
                if (element.declaration.id) {
                  alreadyExportList.push(element.declaration.id.name)
                }
              }
            }
          }
        },
        exit(path) {
          /** 重新定义默认导出对象方法 */
          const departObjectMethod = objectMethodList.map((item) => {
            const key = (item.key as t.Identifier).name || (item.key as t.StringLiteral).value
            const node = t.exportNamedDeclaration(
              t.functionDeclaration(
                t.identifier(key),
                item.params,
                item.body,
                item.generator,
                item.async
              )
            )
            node.leadingComments = item.leadingComments
            node.trailingComments = item.trailingComments
            return node
          })
          path.node.body = [...departObjectMethod, ...path.node.body]
          /** 重新写入默认导出属性 */
          const allExportList = [...tranferExportList, ...alreadyExportList]
          if (!allExportList.length) {
            return
          }
          const target = path.node.body.find((item) =>
            t.isExportDefaultDeclaration(item)
          ) as t.ExportDefaultDeclaration
          /** 存在默认导出 */
          if (target) {
            /** 默认导出是对象 */
            if (t.isObjectExpression(target.declaration)) {
              const existPropertyList: string[] = [] //已知默认导出对象属性
              target.declaration.properties.forEach((item) => {
                if (!t.isSpreadElement(item)) {
                  const key = (item.key as t.Identifier).name || (item.key as t.StringLiteral).value
                  existPropertyList.push(key)
                }
              })
              const newProperties = allExportList
                .filter((item) => !existPropertyList.includes(item))
                .map((item) =>
                  t.objectProperty(t.identifier(item), t.identifier(item), false, true)
                )
              target.declaration.properties = [...target.declaration.properties, ...newProperties]
            } else {
              /** 不是查找目标,忽略不计 */
              return
            }
          } else {
            const newDefaultExport = t.exportDefaultDeclaration(
              t.objectExpression(
                allExportList.map((item) =>
                  t.objectProperty(t.identifier(item), t.identifier(item), false, true)
                )
              )
            )
            path.node.body.push(newDefaultExport)
          }
        }
      }
    }
  }
})
