import { declare } from '@babel/helper-plugin-utils'
import types from '@babel/types'
interface Extra {
  required: string[]
}
export default declare((babel) => {
  const extra: Extra = {
    required: []
  }
  return {
    getExtra() {
      return extra
    },

    name: 'ast-transform',
    visitor: {
      ObjectExpression(path) {
        const properties = path.node.properties
        let currentName = ''

        for (const property of properties) {
          if (types.isObjectProperty(property)) {
            const key = property.key
            const value = property.value
            let currentKey = ''
            let currentValue = null

            if (types.isStringLiteral(key)) {
              currentKey = key.value
            }

            if (types.isIdentifier(key)) {
              currentKey = key.name
            }

            if (types.isLiteral(value)) {
              currentValue = (value as any).value
            }
            //因为for...of是进行顺序迭代，并且required在name之后，就这么决定了
            if (currentKey === 'name' && currentValue) {
              currentName = currentValue
            }

            if (
              currentKey === 'required' &&
              currentValue &&
              !extra.required.includes(currentName)
            ) {
              extra.required.push(currentName)
            }
          }
        }
      },

      Program: {
        exit(path) {}
      }
    }
  }
})
