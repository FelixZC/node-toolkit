import { declare } from '@babel/helper-plugin-utils'
import { identifier, objectPattern, objectProperty } from '@babel/types'
import type { Identifier } from '@babel/types'

const handleFunctionParams = (path) => {}

export default declare((babel) => {
  const extra = {} as Record<string, any>
  extra.funSign = [] as Record<string, any>[]
  return {
    getExtra() {
      return extra
    },

    name: 'ast-transform',
    visitor: {
      FunctionDeclaration(path) {
        const allIdentifier = path.node.params.every((item) => item.type === 'Identifier')

        if (path.node.params.length > 3 && allIdentifier) {
          const params = path.node.params as Identifier[]
          const key = path.node.id!.name
          extra.funSign[key] = params.map((item) => {
            return item.name
          })
          path.node.params = objectPattern(
            params.map((param) => {
              return objectProperty(identifier(param.name), identifier(param.name), false, true)
            })
          )
        }
      }
    }
  }
})
