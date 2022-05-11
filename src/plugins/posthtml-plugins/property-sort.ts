/**
 * 属性键值排序
 */
import { sortObjAttr } from '../../utils/common'
import type PostHTML from 'posthtml'

const propertySort: PostHTML.Plugin<unknown> = (tree) => {
  tree.walk((node) => {
    if (node.attrs) {
      const directiveAttrs: typeof node.attrs = {}
      const refAttrs: typeof node.attrs = {}
      const methodAttrs: typeof node.attrs = {}
      const normalAttrs: typeof node.attrs = {} // ps:记得移除="_pzc_"

      for (const key in node.attrs) {
        if (Object.prototype.hasOwnProperty.call(node.attrs, key)) {
          if (!node.attrs[key]) {
            node.attrs[key] = '_pzc_'
          }
        }
      }

      for (const [key, value] of Object.entries(node.attrs)) {
        switch (true) {
          case key.startsWith('v-'):
            directiveAttrs[key] = value
            break

          case key.startsWith(':'):
            refAttrs[key] = value
            break

          case key.startsWith('@'):
            methodAttrs[key] = value
            break

          default:
            normalAttrs[key] = value
        }
      }

      node.attrs = {
        ...sortObjAttr(directiveAttrs),
        ...sortObjAttr(normalAttrs),
        ...sortObjAttr(refAttrs),
        ...sortObjAttr(methodAttrs)
      }
    }

    return node
  })
}

export default propertySort
