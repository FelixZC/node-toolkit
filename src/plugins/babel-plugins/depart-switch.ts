import { declare } from '@babel/helper-plugin-utils'
import * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
/**
 * 分离连写switch语句
 * 声明一个AST（抽象语法树）转换插件。
 * @param babel Babel实例，提供转换所需的上下文和工具。
 * @return 返回一个定义了转换规则的对象。
 */
export default declare((babel) => {
  return {
    name: 'ast-transform', // 插件名称。
    visitor: {
      // 针对SwitchStatement语句的处理。
      SwitchStatement: {
        enter(path) {
          const cases: string[] = [] // 用于存储已经遍历过的case值。

          // 遍历SwitchCase，移除重复的字符串条件case。
          path.traverse({
            SwitchCase(path) {
              const test = path.node.test

              // 移除重复字符串条件case的逻辑。
              if (t.isLiteral(test)) {
                if (cases.includes((test as t.StringLiteral).value)) {
                  path.remove() // 如果发现重复，则移除该case。
                  return
                } else {
                  cases.push((test as t.StringLiteral).value) // 如果未发现重复，则记录该case的值。
                }
              }
              // 处理case穿透情况，即没有break导致的多个case连续执行问题。
              if (!path.node.consequent.length) {
                let next = path

                // 查找下一个非空的consequent，即下一个实际会执行的case。
                while (!next.node.consequent.length) {
                  next = next.getNextSibling() as NodePath<t.SwitchCase>
                  if (!next.node) return
                }

                // 如果下一个case没有break语句，则添加一个break。
                const isHasBreakStatement = next.node.consequent.find((item) =>
                  t.isBreakStatement(item)
                )

                if (!isHasBreakStatement) {
                  next.node.consequent.push(t.breakStatement())
                }

                // 将当前case的执行体替换为下一个实际执行的case的执行体。
                path.node.consequent = next.node.consequent
              } else {
                // 处理当前case内部缺失break或return的问题。
                const breakTarget = path.node.consequent.find((element) =>
                  t.isBreakStatement(element)
                )
                const returnTarget = path.node.consequent.find((element) =>
                  t.isReturnStatement(element)
                )

                // 如果当前case未发现break或return，则添加一个break。
                if (!breakTarget && !returnTarget) {
                  path.node.consequent.push(t.breakStatement())
                }
              }
            }
          })
        },

        // 离开SwitchStatement时，重排序cases，保证它们按照字典序执行。
        exit(path) {
          path.node.cases.sort((case1, case2) => {
            // 只对字面量类型的case进行排序。
            if (t.isLiteral(case1.test) && t.isLiteral(case2.test)) {
              const case1Value: string = (case1.test as t.StringLiteral)?.value || 'a'
              const case2Value: string = (case2.test as t.StringLiteral)?.value || 'a'
              if (case1Value && case2Value) {
                return String(case1Value).localeCompare(String(case2Value))
              } else {
                return 0
              }
            }

            return 0
          })
        }
      }
    }
  }
})
