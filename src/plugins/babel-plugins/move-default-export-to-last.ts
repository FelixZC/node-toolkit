/**
 * 移动默认导出到最后
 */
import { declare } from '@babel/helper-plugin-utils'
import * as t from '@babel/types'
export default declare((babel) => {
  return {
    name: 'ast-transform',
    visitor: {
      Program: {
        exit(path) {
          const defaultExportIndex = path.node.body.findIndex((item) =>
            t.isExportDefaultDeclaration(item)
          )

          if (defaultExportIndex > -1 && defaultExportIndex !== path.node.body.length - 1) {
            const node = path.node.body[defaultExportIndex]
            path.node.body.splice(defaultExportIndex, 1)
            path.node.body.push(node)
          }
        }
      }
    }
  }
})
