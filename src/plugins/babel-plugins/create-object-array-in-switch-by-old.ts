import { declare } from '@babel/helper-plugin-utils'
import { writeFile } from '../../utils/common'
import formRef from './output/index'
import {
  matchObjectExpress,
  createObjectTemplateNode,
  getMethodName,
  filterSameProperty,
  filterSameObject,
  addObjectNewProperty,
  addNewObject,
  findObjectPropertyWithKey
} from './ast-utils'
import generator from '@babel/generator'
import * as parser from '@babel/parser'
import newLabelListRef from '../../query/json/newLabelList.json'
import sameLabelCacheRef from '../../query/json/sameLabelCache.json'
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

const newLabelList: string[] = []
const newLabelObjectList: Record<string, any> = {}
const sameLabelCache: Record<string, any> = {}
const funCache: Record<string, any> = {}
//返回当前选中分类的名字
function getSortTypeName(sortType: string) {
  const map = new Map([
    ['103', '文书档案'],
    ['104', '合同档案'],
    ['105', '项目档案'],
    ['106', '生产档案'],
    ['107', '人事档案'],
    ['108', '会计凭证'],
    ['109', '会计账簿'],
    ['110', '会计报告'],
    ['111', '其他会计档案'],
    ['112', '照片档案'],
    ['113', '录音档案'],
    ['114', '岩心档案'],
    ['116', '其他档案'],
    ['117', '录像档案'],
    ['118', '全宗档案'],
    ['119', '实物档案'],
    ['120', '设备档案']
  ])
  const sortName = map.get(sortType) || '通用'

  return sortName
}

function getFunctionNameType(functionName: FunctionName) {
  const map = new Map([
    ['annexForm', '文件内容级'],
    ['tomeForm', '案卷目录级'],
    ['catalogForm', '文件目录级'],
    ['tomeCatalogForm', '卷内目录级']
  ])
  const type = map.get(functionName) || '无'

  return type
}

const getNewArrayExpression = (
  elements: t.ObjectExpression[],
  test: t.Expression | null | undefined,
  functionName: FunctionName
) => {
  let switchCondition = (test as t.StringLiteral)?.value
  let outputSort = formRef[functionName](switchCondition) as TemplateNodeOption[]
  if (!outputSort.length) {
    return elements
  }
  const newElements = outputSort.map((item) => {
    const source = matchObjectExpress(elements, 'label', item.label)
    let newObjectExpression: t.ObjectExpression
    if (source) {
      const keys = ['rowShow']
      const rewriteProperties = {} as TemplateNodeOption
      for (const key of Object.keys(item)) {
        if (keys.includes(key)) {
          rewriteProperties[key] = item[key]
        }
      }
      newObjectExpression = createObjectTemplateNode(JSON.stringify(rewriteProperties))
      source.properties = source.properties.filter((element) => {
        if (t.isObjectProperty(element)) {
          const key = (element.key as t.Identifier).name || (element.key as t.StringLiteral).value
          return !keys.includes(key)
        }
        return true
      })
      newObjectExpression.properties = [...source.properties, ...newObjectExpression.properties]
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
    const sortType = getSortTypeName(switchCondition)
    const nameType = getFunctionNameType(functionName)

    //查找新对象
    const statusProperty = findObjectPropertyWithKey(newObjectExpression, '_status_')
    let propProperty = findObjectPropertyWithKey(newObjectExpression, 'prop')

    if (statusProperty && !propProperty) {
      const labelProperty = findObjectPropertyWithKey(newObjectExpression, 'label')
      if (labelProperty) {
        const label = (labelProperty.value as t.StringLiteral).value

        //存取新对象
        if (newLabelListRef.includes(label)) {
          //复写同类项
          for (const [cacheKey, cacheValue] of Object.entries(sameLabelCacheRef)) {
            for (const cacheItem of Object.values(cacheValue)) {
              for (const [cacheItemKey, cacheItemValue] of Object.entries(cacheItem)) {
                if (cacheItemKey === label) {
                  newObjectExpression = parser.parseExpression(
                    cacheItemValue as string
                  ) as t.ObjectExpression
                }
              }
            }
          }
        }
        if (!newLabelList.includes(label)) {
          newLabelList.push(label)
        }
        if (!newLabelObjectList[nameType]) {
          newLabelObjectList[nameType] = {}
        }
        if (!newLabelObjectList[nameType][sortType]) {
          newLabelObjectList[nameType][sortType] = {}
        }
        newLabelObjectList[nameType][sortType][label] = generator(newObjectExpression).code
      }
    }
    //查找旧对象
    propProperty = findObjectPropertyWithKey(newObjectExpression, 'prop')
    if (propProperty) {
      const labelProperty = findObjectPropertyWithKey(newObjectExpression, 'label')
      if (labelProperty) {
        const label = (labelProperty.value as t.StringLiteral).value
        //存储方法属性值
        if (!funCache[nameType]) {
          funCache[nameType] = {}
        }
        if (!funCache[nameType][sortType]) {
          funCache[nameType][sortType] = {}
        }
        if (t.isLiteral(propProperty?.value) && label !== '序号') {
          const prop = (propProperty.value as t.StringLiteral).value
          funCache[nameType][sortType][label] = prop
        }
        //生成同类项
        if (!sameLabelCache[nameType]) {
          sameLabelCache[nameType] = {}
        }
        if (!sameLabelCache[nameType][sortType]) {
          sameLabelCache[nameType][sortType] = {}
        }
        if (newLabelListRef.includes(label)) {
          sameLabelCache[nameType][sortType][label] = generator(newObjectExpression).code
        }
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
                    /** 如果文档不规范，下面两行代码会影响输出结果 */
                    // result = filterSameObject(result, 'prop')
                    result = filterSameProperty(result)
                    path.node.elements = resetIndexObjectProperty(result)
                  }
                })
              }
            })
          }
        })
      },
      Program: {
        exit(path) {
          writeFile(
            'dist/src/query/json/newLabelObjectList.json',
            JSON.stringify(newLabelObjectList)
          )
          writeFile('dist/src/query/json/newLabelList.json', JSON.stringify(newLabelList))
          writeFile('dist/src/query/json/sameLabelCache.json', JSON.stringify(sameLabelCache))
          writeFile('dist/src/query/json/function.json', JSON.stringify(funCache))
        }
      }
    }
  }
})
