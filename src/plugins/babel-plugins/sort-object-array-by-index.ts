import { declare } from '@babel/helper-plugin-utils'
import { findObjectPropertyWithKey, resetIndexObjectProperty } from './ast-utils'
import * as t from '@babel/types'

export default declare((babel) => {
  /**
   * 根据属性index对对象数组进行排序
   * 排序对象数组表达式
   * @param elements - 需要排序的对象数组表达式
   * @returns 排序后的对象数组表达式
   */
  const sortObjectArrayExpression = (elements: t.ObjectExpression[]) => {
    // 定义排序处理器
    const sortHandle = (v1: t.ObjectExpression, v2: t.ObjectExpression) => {
      // 查找对象中的 'index' 属性
      const v1IndexProperty = findObjectPropertyWithKey(v1, 'index')
      const v2IndexProperty = findObjectPropertyWithKey(v2, 'index')

      // 如果任一对象没有 'index' 属性或 'index' 属性值不是字面量，认为它们相等
      if (!v1IndexProperty || !v2IndexProperty) {
        return 0
      }

      // 如果 'index' 属性的值不是数字字面量，认为它们相等
      if (!t.isLiteral(v1IndexProperty.value) || !t.isLiteral(v2IndexProperty.value)) {
        return 0
      }

      // 比较两个对象的 'index' 属性值，并返回比较结果
      const v1Index = (v1IndexProperty.value as any).value
      const v2Index = (v2IndexProperty.value as any).value
      return v1Index - v2Index
    }
    elements.sort(sortHandle) // 对元素进行排序
    return elements // 返回排序后的元素数组
  }

  return {
    name: 'ast-transform',
    visitor: {
      // 访问数组表达式节点
      ArrayExpression(path) {
        const elements = path.node.elements

        // 如果数组为空，直接返回
        if (!elements.length) {
          return
        }

        // 检查数组是否包含所有对象表达式
        const isAllObjectExpression = elements.every((item) => t.isObjectExpression(item))

        // 如果数组中不全是对象表达式，跳过处理
        if (!isAllObjectExpression) {
          return
        }

        // 对元素进行排序，并更新数组节点的元素列表
        let result = sortObjectArrayExpression(elements as t.ObjectExpression[])
        path.node.elements = resetIndexObjectProperty(result)
      }
    }
  }
})
