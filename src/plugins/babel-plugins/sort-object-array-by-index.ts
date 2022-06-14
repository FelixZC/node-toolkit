/**
 * 根据属性index对对象数组进行排序
 */
import { declare } from '@babel/helper-plugin-utils'
import { findObjectPropertyWithKey, resetIndexObjectProperty } from './ast-utils'
import * as t from '@babel/types'
export default declare((babel) => {
  /**
   * 排序对象数组表达式
   * @param elements
   */
  const sortObjectArrayExpression = (elements: t.ObjectExpression[]) => {
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
    elements.sort(sortHandle)
    return elements
  }

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
