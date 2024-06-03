/**
 * Markdown 文件生成工具类，持续完善中...
 * @author pzc
 * @date 2021/08/23
 */

import * as os from 'os'
import { getDataType, sortArray, sortObjAttr } from './common'

const br = os.EOL // 行分隔符

/**
 * 使用指定正则表达式在给定内容中查找匹配项
 * @param {string} content - 要搜索的文本内容
 * @param {RegExp} queryReg - 用于搜索的正则表达式
 * @param {number} [matchIndex=0] - 要返回的匹配项索引（默认：0）
 * @param {Function} [customHandel] - 可选的自定义处理函数，用于处理匹配结果
 * @returns {string} 提取或处理后的文本内容
 */
function queryContentByReg(
  content: string,
  queryReg: RegExp,
  matchIndex = 0,
  customHandel?: Function
) {
  let queryResult
  let str = ''

  if (queryReg.global) {
    while ((queryResult = queryReg.exec(content))) {
      str +=
        customHandel && typeof customHandel === 'function'
          ? customHandel(queryResult)
          : queryResult[matchIndex] + br
    }
  } else if ((queryResult = queryReg.exec(content))) {
    str +=
      customHandel && typeof customHandel === 'function'
        ? customHandel(queryResult)
        : queryResult[matchIndex] + br
  }

  return str
}

/**
 * 创建属性描述表格
 * @param {*} attrGroup - 属性描述分组后的对象
 * @returns {string} 包含首字母索引的属性描述表格字符串
 */
function createdAttributesGroupTable(attrGroup: Record<string, any>) {
  let localAttrGroup = attrGroup
  const dataType = getDataType(localAttrGroup)

  if (dataType !== 'Object') {
    throw new Error('createdAttributesGroupTable数据类型错误')
  }

  localAttrGroup = sortObjAttr(localAttrGroup)
  let attributesDescriptionTable = ''

  for (const attrGroupItem of Object.values(localAttrGroup)) {
    if (Reflect.get(attrGroupItem, 'groupKey') && Reflect.get(attrGroupItem, 'group')) {
      const title = Reflect.get(attrGroupItem.group[0], attrGroupItem.groupKey)
      attributesDescriptionTable += `## ${title}${br}`
      attributesDescriptionTable += `|字段|描述|${br}`
      attributesDescriptionTable += `|-|-|${br}`
      const group = sortArray(attrGroupItem.group, 'key')

      for (const groupItem of group) {
        attributesDescriptionTable += `${groupItem.key}|${groupItem.value}|${br}`
      }
    }
  }

  return attributesDescriptionTable
}

/**
 * 创建与 Store 中字段相对应的表述表格，需要预先创建包含 Store 所有模块初始数据的文件
 * @param {Object} stateInStore - Store 的初始对象
 * @param {Object} annotationObj - 字段注释对象
 * @param {Number} [leavl=1] - 模块层级数
 * @param {Array} [cache=[]] - 模块属性缓存数组
 * @returns {string} 带索引的 Store 对应字段表述表格
 */
function createdStoreTable(
  stateInStore: Record<string, any>,
  annotationObj: Record<string, any>,
  leavl = 1,
  cache: string[] = []
) {
  let localStateInStore = stateInStore
  const dataType = getDataType(localStateInStore)

  if (dataType !== 'Object') {
    throw new Error('createdStoreTable数据类型错误')
  }

  localStateInStore = sortObjAttr(localStateInStore)
  let createdStoreTableStr = ''

  if (typeof localStateInStore !== 'object') {
    return ''
  }

  if (localStateInStore.title) {
    createdStoreTableStr += `### ${localStateInStore.title}${br}`
  }

  if (leavl === 1) {
    createdStoreTableStr += `## root${br}`
  }

  createdStoreTableStr += `|字段|类型|默认|注释|${br}`
  createdStoreTableStr += `|-|-|-|-|${br}`

  for (const key in localStateInStore) {
    const type = getDataType(localStateInStore[key])
    const value = JSON.stringify(localStateInStore[key])
    const descript = annotationObj[key] || ''

    if (type === 'Object' && Object.keys(localStateInStore[key]).length) {
      const storeModule = localStateInStore[key]
      storeModule.title = key
      const nextLeavl = leavl + 1

      if (nextLeavl <= 2) {
        createdStoreTable(storeModule, annotationObj, nextLeavl, cache)
      }
    } else {
      createdStoreTableStr += `${key}|${type}|${value}|${descript}|${br}`
    }
  }

  if (leavl === 1) {
    cache.unshift(createdStoreTableStr) // 添加根记录
  } else {
    cache.push(createdStoreTableStr)
  }

  return cache.join(br)
}

export default {
  createdAttributesGroupTable,
  createdStoreTable,
  queryContentByReg
}
