/**
 * 操作指定函数，嵌套在switch中的对象数组
 */
import { declare } from '@babel/helper-plugin-utils'
import { getValueByKeys, setValueByKeys, strToJson, writeFile } from '../../utils/common'
import {
  createObjectTemplateNode,
  filterSameObject,
  filterSameProperty,
  findObjectPropertyWithKey, // replaceExpressionProperty,
  // addObjectNewProperty
  getMethodName,
  matchObjectExpress
} from './ast-utils'
import { cloneDeep } from 'lodash' //@ts-ignore

import { resetIndexObjectProperty } from './sort-object-array-by-index'
import { NodePath } from '@babel/core'
import { defaultObjDeatil } from '../../utils/excel/excel-to-json'
import formRef from '../../utils/excel/output/index'
import generator from '@babel/generator'
import * as parser from '@babel/parser'
import sameObjectCacheRef from '../../query/json/same-object-cache.json'
import * as t from '@babel/types'
import type { ObjDeatil } from '../../utils/excel/typing/type' // import { getFileType } from '../../utils/excel/utils/map'

type FunctionName = 'annexForm' | 'tomeForm' | 'catalogForm' | 'tomeCatalogForm'
const functionNameList: FunctionName[] = ['annexForm', 'tomeForm', 'catalogForm', 'tomeCatalogForm']
const newObjectCache: Record<string, ObjDeatil> = {}
const sameObjectCache: Record<string, ObjDeatil> = {}
const excelObjectList: ObjDeatil[] = []
/**
 * 以excel为主，代码为辅，复写已有属性
 * @param elements
 * @param test
 * @param functionName
 * @returns
 */

const getNewExpressionArrayByExcel = (
  elements: t.ObjectExpression[],
  test: t.Expression | null | undefined,
  functionName: FunctionName
) => {
  let switchCondition = (test as t.StringLiteral)?.value
  let outputSort = formRef[functionName](switchCondition) as ObjDeatil[]
  const newElements = outputSort.map((item) => {
    const matchObjIndex = matchObjectExpress(elements, 'prop', item.prop)
    let newObjectExpression: t.ObjectExpression
    /**1、已存在对象则创造新对象的同时，合并原有对象属性，2、不存在则直接创造新对象 */

    if (matchObjIndex > -1) {
      newObjectExpression = createObjectTemplateNode(JSON.stringify(item))
      newObjectExpression.properties = [
        ...elements[matchObjIndex].properties,
        ...newObjectExpression.properties
      ]
    } else {
      newObjectExpression = createObjectTemplateNode(JSON.stringify(item))

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
/**
 * 以代码为主，excel为辅，复写已有属性
 * @param elements
 * @param test
 * @param functionName
 * @returns
 */
// const checkExpressionArrayWithExcel = (
//   elements: t.ObjectExpression[],
//   test: t.Expression | null | undefined,
//   functionName: FunctionName
// ) => {
//   let switchCondition = (test as t.StringLiteral)?.value
//   let outputSort = formRef[functionName](switchCondition) as ObjDeatil[]
//   return elements.map((element) => {
//     const propProperty = findObjectPropertyWithKey(element, 'prop')
//     if (propProperty) {
//       const propPropertyValue = (propProperty.value as t.StringLiteral).value
//       const item = outputSort.find((item) => item.prop === propPropertyValue)
//       let newObjectExpression: t.ObjectExpression
//       if (item) {
//         newObjectExpression = createObjectTemplateNode(JSON.stringify(item))
//         newObjectExpression.properties = [...element.properties, ...newObjectExpression.properties]
//       } else {
//         newObjectExpression = addObjectNewProperty(
//           element,
//           JSON.stringify({
//             sortTypeValue: switchCondition || 'common',
//             //@ts-ignore
//             resoure: getFileType(functionName.split('Form')[0], true)
//           })
//         )
//       }
//       return newObjectExpression
//     }
//     return element
//   })
// }

/**
 * 保存已知对象
 * @param newObjectExpression
 * @param keys
 */

const saveObjectCache = (newObjectExpression: t.ObjectExpression, keys: string[]) => {
  //存储已知含有prop且不为空的对象，再次查找包含复写记录的对象表达式
  let propProperty = findObjectPropertyWithKey(newObjectExpression, 'prop')

  if (propProperty && t.isLiteral(propProperty?.value)) {
    const propPropertyValue = (propProperty.value as t.StringLiteral).value
    const temp = cloneDeep(newObjectExpression)
    const defaultObjDeatilKeys = Object.keys(defaultObjDeatil)
    /** 过滤excel表格输出需要字段  */

    temp.properties = temp.properties.filter((element) => {
      if (t.isObjectProperty(element)) {
        const key = (element.key as t.Identifier).name || (element.key as t.StringLiteral).value
        return defaultObjDeatilKeys.includes(key)
      }

      return true
    })
    /** 存储输出转化excel对象 */

    excelObjectList.push(strToJson(generator(temp).code))
    /** 存储同类项 */

    setValueByKeys(
      sameObjectCache,
      [...keys, propPropertyValue],
      generator(newObjectExpression).code
    )
  }
}
/**
 * 读取已知对象
 * @param newObjectExpression
 * @param keys
 * @returns
 */

const loadObjectCache = (newObjectExpression: t.ObjectExpression, keys: string[]) => {
  /** 对新对象缺省值作同类项覆盖处理 */
  let statusProperty = findObjectPropertyWithKey(newObjectExpression, '_status_')
  let propProperty = findObjectPropertyWithKey(newObjectExpression, 'prop')
  /** 查找新增对象标志，作为唯一标志，这里不允许prop属性不存在，但可以为空*/

  if (statusProperty && propProperty) {
    const statusPropertyValue = (statusProperty.value as t.StringLiteral).value
    const propPropertyValue = (propProperty.value as t.StringLiteral).value

    switch (true) {
      /**存在新增标志， prop值为空*/
      case statusPropertyValue === 'newAdd' && !propPropertyValue:
      /**存在重置标志,自己在代码里批量指定添加 */

      case statusPropertyValue === 'reset':
        //获取同类项
        const sameObject = getValueByKeys(sameObjectCacheRef, [...keys, propPropertyValue]) //复写同类项

        if (sameObject) {
          newObjectExpression = parser.parseExpression(sameObject) as t.ObjectExpression
        }
        /** 保存复写记录 */

        setValueByKeys(
          newObjectCache,
          [...keys, propPropertyValue],
          generator(newObjectExpression).code
        )
        break
    }
  }

  return newObjectExpression
}
/**
 * 对对象数组额外处理
 * @param elements
 * @param test
 * @param functionName
 * @returns
 */

const handleExpressionArray = (
  elements: t.ObjectExpression[],
  test: t.Expression | null | undefined,
  functionName: FunctionName
) => {
  let switchCondition = (test as t.StringLiteral)?.value
  const nameType = functionName
  const sortType = switchCondition || 'common'
  const keys = [nameType, sortType]
  elements = elements.map((objectExpression) => {
    const localObjectExpression = loadObjectCache(objectExpression, keys)
    saveObjectCache(localObjectExpression, keys)
    return localObjectExpression
  })
  return elements
}
/**
 * 根据现有switchcase重组代码,此方法仍然不具备创建新的switchcase，需要重写
 * @param elements
 * @param test
 */

export default declare((babel) => {
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
        const functionName = getMethodName(path) //@ts-ignore

        if (!functionNameList.includes(functionName)) {
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
                    /** 只对全对象数组表达式做处理 */

                    const isAllObjectExpression = elements.every((item) =>
                      t.isObjectExpression(item)
                    )

                    if (!isAllObjectExpression) {
                      return
                    }

                    let result = elements as t.ObjectExpression[]
                    /** 可与checkExpressionArrayWithExcel交换使用 */
                    result = getNewExpressionArrayByExcel(
                      result,
                      test,
                      functionName as FunctionName
                    )
                    /** 替换符合条件的对象属性 */
                    // result = replaceExpressionProperty(result, 'prop', 'mutualNum', {
                    //   Tshow: true,
                    //   Fshow: true
                    // })
                    /** 过滤指定相同属性对象 */
                    result = filterSameObject(result, 'prop')
                    /** 过滤相同属性 */
                    result = result.map((element) => filterSameProperty(element))
                    /** 添加缓存记录 */
                    result = handleExpressionArray(result, test, functionName as FunctionName)
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
          writeFile('dist/src/query/json/new-object-cache.json', JSON.stringify(newObjectCache))
          writeFile('dist/src/query/json/same-object-cache.json', JSON.stringify(sameObjectCache))
          writeFile('dist/src/query/json/excel-object-list.json', JSON.stringify(excelObjectList))
        }
      }
    }
  }
})
