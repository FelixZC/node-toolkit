/**
 * 根据属性index对对象数组进行排序
 */
import { declare } from '@babel/helper-plugin-utils'
import { findObjectPropertyWithKey } from './ast-utils'
import * as t from '@babel/types' //

/**
 * 重置Index
 * @param elements
 */

export const resetIndexObjectProperty = (elements: t.ObjectExpression[]) => {
  let count = 0

  for (const element of elements) {
    const indexProperty = findObjectPropertyWithKey(element, 'index')

    if (indexProperty && indexProperty.value) {
      indexProperty.value = t.numericLiteral(count)
    } else {
      const newIndexProperty = t.objectProperty(t.identifier('index'), t.numericLiteral(count))
      element.properties.push(newIndexProperty)
    }

    count++
  }

  return elements
}
/**
 * 获取根据index进行排序的排序方法
 * @returns
 */

export const getSortMethod = () => {
  /**
   * 排序对象数组
   * @param v1
   * @param v2
   * @returns
   */
  const sortHandle = (v1: t.ObjectExpression, v2: t.ObjectExpression) => {
    const v1IndexProperty = findObjectPropertyWithKey(v1, 'index')
    const v2IndexProperty = findObjectPropertyWithKey(v2, 'index')

    if (!v1IndexProperty || !v2IndexProperty) {
      return 0
    }

    if (!t.isLiteral(v1IndexProperty.value) || !t.isLiteral(v2IndexProperty.value)) {
      return 0
    }

    const v1Index = (v1IndexProperty.value as any).value
    const v2Index = (v2IndexProperty.value as any).value
    return v1Index - v2Index
  }

  return sortHandle
}
/**
 * 排序对象数组表达式
 * @param elements
 */

export const sortObjectArrayExpression = (elements: t.ObjectExpression[]) => {
  const sortMethod = getSortMethod()
  elements.sort(sortMethod)
  return elements
}
export default declare((babel) => {
  // const { types: t } = babel
  return {
    name: 'ast-transform',
    visitor: {
      ArrayExpression(path) {
        const elements = path.node.elements

        if (!elements.length) {
          return
        }
        /** 只对全对象数组表达式做处理 */

        const isAllObjectExpression = elements.every((item) => t.isObjectExpression(item))

        if (!isAllObjectExpression) {
          return
        }

        let result = sortObjectArrayExpression(elements as t.ObjectExpression[])
        path.node.elements = resetIndexObjectProperty(result)
      }
    }
  }
})