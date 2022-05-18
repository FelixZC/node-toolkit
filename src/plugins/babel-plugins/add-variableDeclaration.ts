/**
 * 对未定义表达式进行引用重定义
 * 使用情况极其有限，针对超老未模块化项目使用
 */
import { declare } from '@babel/helper-plugin-utils'
import { getImportInfo } from './ast-utils'
import * as t from '@babel/types'
export default declare((babel) => {
  const importLocalNameList: string[] = []
  const refNameList: string[] = []
  const declarationNameList: string[] = []
  return {
    name: 'ast-transform',
    visitor: {
      Program: {
        enter(path) {
          /**查找导入声明 */
          path.traverse({
            ImportDeclaration(path) {
              const importInfo = getImportInfo(path.node)

              for (const item of importInfo) {
                if (!importLocalNameList.includes(item.localName)) {
                  importLocalNameList.push(item.localName)
                }
              }
            }
          })
          /** 查找定义声明 */

          path.traverse({
            VariableDeclaration(path) {
              const declarations = path.node.declarations
              declarations.find((declaration) => {
                if (t.isIdentifier(declaration.id)) {
                  const declarationName = declaration.id.name

                  if (!declarationNameList.includes(declarationName)) {
                    declarationNameList.push(declarationName)
                  }
                }
              })
            }
          })
          /**查找赋值表达 */

          path.traverse({
            AssignmentExpression(path) {
              const left = path.node.left

              if (t.isMemberExpression(left)) {
                if (t.isIdentifier(left.object)) {
                  const refName = left.object.name
                  const functionParent = path.getFunctionParent()

                  if (functionParent) {
                    // const params = functionParent.node.params
                    // const paramNameList: string = []
                    // /** 获取方法参数，情况太复杂了，不考虑了，交给作用域自己去判断 */
                    // params.forEach((param) => {
                    //   if (t.isIdentifier(param)) {
                    //   } else if (t.isPattern(param)) {
                    //   } else if (t.isRestElement(param)) {
                    //   }
                    // })
                    if (
                      !refNameList.includes(refName) &&
                      !importLocalNameList.includes(refName) &&
                      !declarationNameList.includes(refName)
                    ) {
                      refNameList.push(refName)
                    }
                  }
                }
              }
            }
          })
        },

        exit(path) {
          /** 对为未定义表达式参数重新定义为空对象 */
          const declarations: t.VariableDeclarator[] = refNameList.map((name) => {
            return t.variableDeclarator(t.identifier(name), t.objectExpression([]))
          })
          const variableDeclaration = t.variableDeclaration('const', declarations)
          const body = path.node.body

          for (let index = body.length - 1; index >= 0; index--) {
            if (t.isImportDeclaration(body[index])) {
              body.splice(index + 1, 0, variableDeclaration)
              return
            }
          }
        }
      }
    }
  }
})
