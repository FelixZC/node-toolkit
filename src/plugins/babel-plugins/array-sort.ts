import { declare } from '@babel/helper-plugin-utils'
import type {
  NumericLiteral,
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
} from '@babel/types'
export default declare((babel) => {
  const sortObjectArray = (v1: ObjectExpression, v2: ObjectExpression) => {
    const v1IndexProperty = v1.properties.find(
      (item) =>
        item.type === 'ObjectProperty' &&
        item.key.type === 'Identifier' &&
        item.key.name === 'index'
    ) as ObjectProperty
    const v2IndexProperty = v2.properties.find(
      (item) =>
        item.type === 'ObjectProperty' &&
        item.key.type === 'Identifier' &&
        item.key.name === 'index'
    ) as ObjectProperty

    if (!v1IndexProperty || !v2IndexProperty) {
      return 0
    }

    const v1Index = v1IndexProperty.value.value
    const v2Index = v2IndexProperty.value.value
    return v1Index - v2Index
  }

  const sortStringArray = (v1: StringLiteral, v2: StringLiteral) => {
    return v1.value.localeCompare(v2.value)
  }

  const sortNumberArray = (v1: NumericLiteral, v2: NumericLiteral) => {
    return v1.value - v2.value
  } // const { types: t } = babel

  return {
    name: 'ast-transform',
    // not required
    visitor: {
      ArrayExpression(path) {
        //排除new Map([])影响
        if (path.findParent((path) => path.isNewExpression())) {
          return
        }

        let elements = path.node.elements

        if (elements.length) {
          const isObjectArray = elements.every(
            (i) => i && i.type === 'ObjectExpression'
          )
          const isStringArray = elements.every(
            (i) => i && i.type === 'StringLiteral'
          )
          const isNumberArray = elements.every(
            (i) => i && i.type === 'NumericLiteral'
          )

          if (isObjectArray) {
            ;(elements as ObjectExpression[]).sort(sortObjectArray)
          }

          if (isStringArray) {
            ;(elements as StringLiteral[]).sort(sortStringArray)
          }

          if (isNumberArray) {
            ;(elements as NumericLiteral[]).sort(sortNumberArray)
          }
        }
      },
    },
  }
})
