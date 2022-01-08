import type PostHTML from 'posthtml'

/**
 * 获取数据类型
 * @param {any} obj
 * @returns {String} 数据构造器对应字符串
 */
export const getDataType = (obj: object) => {
  return Object.prototype.toString.call(obj).slice(8, -1)
}

/**
 * 对对象内部属性排序
 * @param {Object} target
 * @returns {Object} 属性排序后对象
 */
function sortObjAttr(target: Record<string, any>) {
  const dataType = getDataType(target)
  if (dataType !== 'Object') {
    throw new Error('sortObjAttr数据类型错误')
  }
  const newObj = {} as Record<string, any>
  const keys = Object.keys(target).sort((a, b) => {
    return a.localeCompare(b)
  })
  keys.forEach((key) => {
    newObj[key] = target[key]
  })
  return newObj
}

const posthtmlPlugin: PostHTML.Plugin<unknown> = (tree) => {
  tree.walk((node) => {
    if (node.attrs) {
      const directiveAttrs: typeof node.attrs = {}
      const refAttrs: typeof node.attrs = {}
      const methodAttrs: typeof node.attrs = {}
      const normalAttrs: typeof node.attrs = {}
      //ps:记得移除="_pzc_"
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
export default posthtmlPlugin
