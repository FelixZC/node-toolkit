import { declare } from '@babel/helper-plugin-utils'
import Columns from './output/index'
import {
  matchObjectExpress,
  createTemplateNode,
  getMethodName,
  filterSameProperty,
  filterSameObject,
  addObjectNewProperty,
  addNewObject
} from './ast-utils'
import { resetIndexObjectProperty } from './sort-object-array-by-index'
import * as t from '@babel/types'
import { NodePath } from '@babel/core'
type FunctionName = 'annexForm' | 'tomeForm' | 'catalogForm'
interface TemplateNodeOption {
  label: string
  Fshow?: boolean
  Tshow?: boolean
  rowShow?: number
  index?: number
  prop?: string
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
  let switchCondition = (test as t.StringLiteral)?.value || 'common'
  const outputSort = Columns[functionName](switchCondition) as TemplateNodeOption[]
  const newElements = outputSort.map((item) => {
    const source = matchObjectExpress(elements, 'label', item.label)
    const keys = ['label', 'rowShow', 'type', 'Tshow', 'Fshow']
    const rewriteProperties = {} as TemplateNodeOption
    for (const key of Object.keys(item)) {
      if (keys.includes(key)) {
        rewriteProperties[key] = item[key]
      }
    }
    const newObjectExpressopm = createTemplateNode(rewriteProperties)
    if (source) {
      source.properties = source.properties.filter(
        (element) =>
          t.isObjectProperty(element) &&
          t.isIdentifier(element.key) &&
          !keys.includes(element.key.name)
      )
      source.properties = [...source.properties, ...newObjectExpressopm.properties]
      return source
    }
    return newObjectExpressopm
  })
  return newElements
}

export default declare((babel) => {
  const handleFuntionName: string[] = [
    'annexForm',
    'tomeForm',
    'catalogForm',
    'tomeFormInBox',
    'tomeCatalog'
  ]
  return {
    name: 'ast-transform',
    visitor: {
      Function(path) {
        const functionName = getMethodName(path)
        //@ts-ignore
        if (!handleFuntionName.includes(functionName)) {
          return
        }
        path.traverse({
          SwitchStatement: {
            enter(path) {
              path.traverse({
                SwitchCase(path) {
                  const test = path.node.test
                  //处理 case穿透情况
                  if (!path.node.consequent.length) {
                    let next = path
                    while (!next.node.consequent.length) {
                      next = next.getNextSibling() as NodePath<t.SwitchCase>
                    }
                    path.node.consequent = next.node.consequent
                  }
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
                      let result = addNewObject(
                        elements as t.ObjectExpression[],
                        `{
                        attrs: {
                          clearable: true
                        },
                        customComponent: InputWithSelectLocation,
                        Fshow: true,
                        index: 30,
                        label: '存储位置',
                        minWidth: '200',
                        prop: 'storageLocation',
                        Tshow: false,
                        type: 'component',
                        showOverflowTooltip: true,
                        sortable: 'custom'
                      }`
                      )
                      result = addObjectNewProperty(result, {
                        showOverflowTooltip: true,
                        sortable: 'custom'
                      })
                      // result = getNewArrayExpression(result, test, functionName as FunctionName)
                      result = filterSameObject(result, 'prop')
                      result = filterSameProperty(result)
                      path.node.elements = resetIndexObjectProperty(result)
                    }
                  })
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
        })
      }
    }
  }
})
