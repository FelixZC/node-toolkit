/**
 * 驼峰命名转化
 */
import { isPath, transferRef } from '../../utils/common'
import type PostHTML from 'posthtml'
/**
 * 驼峰命名转化的PostHTML插件
 * 该插件遍历HTML树节点，对节点的属性进行处理：
 * 1. 为没有值的属性设置一个临时值 `_pzc_`；
 * 2. 对属性值进行路径检查和转换，将相对路径转换为绝对路径或进行其他必要的处理。
 * @param tree - PostHTML树，表示HTML文档的结构。
 * @returns 返回处理后的PostHTML树。
 */
const propertySort: PostHTML.Plugin<unknown> = (tree) => {
  // 遍历树中的每个节点
  tree.walk((node) => {
    if (node.attrs) {
      // 为没有值的属性设置默认值
      for (const key in node.attrs) {
        if (Object.prototype.hasOwnProperty.call(node.attrs, key)) {
          if (!node.attrs[key]) {
            node.attrs[key] = '_pzc_'
          }
        }
      }

      const urlReg = /(?:url|require)\(['"`]?([\s\S]*?)['"`]?\)/

      // 检查并处理属性值中的路径
      for (const [key, value] of Object.entries(node.attrs)) {
        if (typeof value === 'string' && !value.includes('$')) {
          let result

          // 处理URL和require语句中的路径
          if ((result = urlReg.exec(value))) {
            if (isPath(result[1])) {
              node.attrs[key] = transferRef(value)
            }
          } else {
            // 直接处理其他路径
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
