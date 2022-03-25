import { parseDocs } from '../plugins/generate-vue-docs'
import { getDataType, sortArray, sortObjAttr } from './common'
/**
 * md文件生成工具类，完善中...
 * @author pzc
 * @date 2021/08/23
 *
 */

import * as os from 'os'
const br = os.EOL // 换行符

/**
 * 根据指定正则查找内容
 * @param {String} content 查找内容
 * @param {RegExp} queryReg 正则表达式
 * @param {Number} matchIndex 指定匹配子项
 * @param {Number} customHandel 自定义返回子项结果
 * @returns
 */

function queryContentByReg(
  content: string,
  queryReg: RegExp,
  matchIndex = 0,
  customHandel?: Function
) {
  if (!queryReg?.exec) {
    return
  }

  if (typeof content !== 'string') {
    return
  }

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
 * 文本去重格式化
 * @param {String} content
 * @param {String} mode 去重模式，txt转Md并格式化/txt格式Txt/default纯粹去重
 */

function textFormat(content: string, mode = 'md') {
  const reg = /.*/g
  const match = content.match(reg)

  if (!match) {
    return content
  }

  let result = Array.from(new Set(match))
  result = result.filter((item) => item.match(/[\S]/)) // 去除空白行

  let str = ''
  let title = ''

  switch (mode) {
    case 'txtToMd':
      result = result.map((item, index) => {
        let localItem = item
        localItem = localItem.trim()

        if ((index + 1) % 2 === 0) {
          return `${localItem}${br}` // 额外添加行间距
        }

        return `> ${(index + 2) / 2}. **${localItem}**  `
      })
      title = `## 摘自百度翻译(good good study,day day up)${br}`
      str = title + result.join(br)
      break

    case 'txtToTxt':
      result = result.map((item, index) => {
        let localItem = item
        localItem = localItem.trim()

        if ((index + 1) % 2 === 0) {
          return `${localItem}${br}` // 额外添加行间距
        }

        return localItem
      })
      str = result.join(br)
      break

    default:
      // 输出行结果
      result = result.map((item) => {
        let localItem = item
        localItem = localItem.trim()
        return localItem
      })
      str = title + result.join(br)
  }

  return str
}
/**
 * 创建属性描述表格
 * @param {*} attrGroup //属性描述分组后对象
 * @returns {String} 带首字母索引的属性描述表格字符串
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
 * 创建store对应字段表述表格,需要创建包含store所有模块初始化数据的文件
 * @param {Object} stateInStore store初始对象
 * @param {Object} annotationObj 属性注释
 * @param {Number} leavl 模块层数
 * @param {Array} cache 模块属性缓存数组
 * @returns {String} 带索引的store对应字段表述表格
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
  parseDocs,
  queryContentByReg,
  textFormat
}
