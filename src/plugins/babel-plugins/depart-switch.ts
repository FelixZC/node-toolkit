import { declare } from '@babel/helper-plugin-utils'
import { NodePath } from '@babel/core'
import * as t from '@babel/types'
export default declare((babel) => {
  return {
    name: 'ast-transform',
    visitor: {
      SwitchStatement: {
        enter(path) {
          const cases: string[] = []
          path.traverse({
            SwitchCase(path) {
              const test = path.node.test
              /** 移除重复字符串条件case */

              if (t.isLiteral(test)) {
                if (cases.includes((test as t.StringLiteral).value)) {
                  path.remove()
                  return
                } else {
                  cases.push((test as t.StringLiteral).value)
                }
              }
              /** 处理case穿透情况 */

              if (!path.node.consequent.length) {
                let next = path

                while (!next.node.consequent.length) {
                  next = next.getNextSibling() as NodePath<t.SwitchCase>
                }
                /** 强制添加break  */

                const isHasBreakStatement = next.node.consequent.find((item) =>
                  t.isBreakStatement(item)
                )

                if (!isHasBreakStatement) {
                  next.node.consequent.push(t.breakStatement())
                }

                path.node.consequent = next.node.consequent
              } else {
                /** 处理break缺失问题 */
                const breakTarget = path.node.consequent.find((element) =>
                  t.isBreakStatement(element)
                )
                const returnTarget = path.node.consequent.find((element) =>
                  t.isReturnStatement(element)
                )

                if (!breakTarget && !returnTarget) {
                  path.node.consequent.push(t.breakStatement())
                }
              }
            }
          })
        },

        //离开SwitchStatement重排序cases排序
        exit(path) {
          path.node.cases.sort((case1, case2) => {
            if (t.isLiteral(case1.test) && t.isLiteral(case2.test)) {
              const case1Value: string = (case1.test as t.StringLiteral)?.value || 'a'
              const case2Value: string = (case2.test as t.StringLiteral)?.value || 'a'
              return case1Value.localeCompare(case2Value)
            }

            return 0
          })
        }
      }
    }
  }
})
