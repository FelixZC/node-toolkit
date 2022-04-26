import { declare } from '@babel/helper-plugin-utils'
import Columns from './output/index'
import {
  matchObjectExpress,
  createObjectTemplateNode,
  getMethodName,
  filterSameProperty,
  filterSameObject,
  addObjectNewProperty,
  addNewObject,
  findObjectPropertyWithIdentifierKey
} from './ast-utils'
import { resetIndexObjectProperty } from './sort-object-array-by-index'
import * as t from '@babel/types'
import { NodePath } from '@babel/core'
type FunctionName = 'annexForm' | 'tomeForm' | 'catalogForm' | 'tomeCatalogForm'
interface TemplateNodeOption {
  label: string
  Fshow?: boolean
  Tshow?: boolean
  rowShow?: number
  index?: number
  prop?: string
  type:
    | 'input'
    | 'number'
    | 'autocomplete'
    | 'textarea'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'date'
    | 'time'
    | 'switch'
    | 'component'
    | 'selection'
    | 'index'
  [key: string]: any
}
/**
 * 根据现有switchcase重组代码,此方法仍然不具备创建新的switchcase，需要重写
 * @param elements
 * @param test
 */
const getNewArrayExpression = (
  elements: t.ObjectExpression[],
  test: t.Expression | null | undefined,
  functionName: FunctionName
) => {
  let switchCondition = (test as t.StringLiteral)?.value
  let outputSort = Columns[functionName](switchCondition) as TemplateNodeOption[]
  if (!outputSort.length) {
    return elements
  }
  const newElements = outputSort.map((item) => {
    const source = matchObjectExpress(elements, 'label', item.label)
    let newObjectExpression: t.ObjectExpression
    if (source) {
      const keys = ['rowShow', 'Tshow', 'Fshow']
      const rewriteProperties = {} as TemplateNodeOption
      for (const key of Object.keys(item)) {
        if (keys.includes(key)) {
          rewriteProperties[key] = item[key]
        }
      }
      newObjectExpression = createObjectTemplateNode(JSON.stringify(rewriteProperties))
      source.properties = source.properties.filter(
        (element) =>
          t.isObjectProperty(element) &&
          t.isIdentifier(element.key) &&
          !keys.includes(element.key.name)
      )
      source.properties = [...source.properties, ...newObjectExpression.properties]
      return source
    } else {
      const keys = ['label', 'rowShow', 'type', 'Tshow', 'Fshow']
      const newProperties = {} as TemplateNodeOption
      for (const key of Object.keys(item)) {
        if (keys.includes(key)) {
          newProperties[key] = item[key]
        }
      }
      newObjectExpression = createObjectTemplateNode(JSON.stringify(newProperties))
      if (item.type !== 'index' && item.type !== 'selection') {
        newObjectExpression.properties.push(
          t.objectProperty(t.identifier('_status_'), t.stringLiteral('newAdd'))
        )
      }
    }
    return newObjectExpression
  })
  return newElements
}

export default declare((babel) => {
  const handleFuntionName: string[] = ['annexForm', 'tomeForm', 'catalogForm', 'tomeCatalogForm']
  return {
    name: 'ast-transform',
    visitor: {
      //先执行这个
      SwitchStatement: {
        enter(path) {
          const cases: string[] = []
          path.traverse({
            SwitchCase(path) {
              const test = path.node.test
              //移除重复字符串条件case
              if (t.isLiteral(test)) {
                if (cases.includes((test as t.StringLiteral).value)) {
                  path.remove()
                  return
                } else {
                  cases.push((test as t.StringLiteral).value)
                }
              }
              //处理case穿透情况
              if (!path.node.consequent.length) {
                let next = path
                while (!next.node.consequent.length) {
                  next = next.getNextSibling() as NodePath<t.SwitchCase>
                }
                //强制添加break
                const isHasBreakStatement = next.node.consequent.find((item) =>
                  t.isBreakStatement(item)
                )
                if (!isHasBreakStatement) {
                  next.node.consequent.push(t.breakStatement())
                }
                path.node.consequent = next.node.consequent
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
      },
      //再执行这个,或者直接执行两次
      Function(path) {
        const functionName = getMethodName(path)
        //@ts-ignore
        if (!handleFuntionName.includes(functionName)) {
          return
        }
        path.traverse({
          SwitchStatement(path) {
            path.traverse({
              SwitchCase(path) {
                const test = path.node.test
                path.traverse({
                  ArrayExpression(path) {
                    const elements = path.node.elements
                    if (!elements.length) {
                      return
                    }
                    //只对全对象数组表达式做处理
                    const isAllObjectExpression = elements.every((item) =>
                      t.isObjectExpression(item)
                    )
                    if (!isAllObjectExpression) {
                      return
                    }

                    let result = elements as t.ObjectExpression[]
                    result = getNewArrayExpression(result, test, functionName as FunctionName)
                    result = filterSameObject(result, 'prop')
                    result = filterSameProperty(result)
                    path.node.elements = resetIndexObjectProperty(result)
                  }
                })
              }
            })
          }
        })
      }
    }
  }
})
