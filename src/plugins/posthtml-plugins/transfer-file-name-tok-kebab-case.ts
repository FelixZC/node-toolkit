import { isPath, transferRef } from '../../utils/common'
import type PostHTML from 'posthtml'

const propertySort: PostHTML.Plugin<unknown> = (tree) => {
  tree.walk((node) => {
    if (node.attrs) {
      for (const key in node.attrs) {
        if (Object.prototype.hasOwnProperty.call(node.attrs, key)) {
          if (!node.attrs[key]) {
            node.attrs[key] = '_pzc_'
          }
        }
      }

      const urlReg = /(?:url|require)\(['"`]?([\s\S]*?)['"`]?\)/

      for (const [key, value] of Object.entries(node.attrs)) {
        if (typeof value === 'string' && !value.includes('$')) {
          let result

          if ((result = urlReg.exec(value))) {
            if (isPath(result[1])) {
              node.attrs[key] = transferRef(value)
            }
          } else {
            if (isPath(value)) {
              node.attrs[key] = transferRef(value)
            }
          }
        }
      }
    }

    return node
  })
}

export default propertySort
