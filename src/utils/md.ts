/**
 * md文件生成工具类，完善中...
 * @author pzc
 * @date 2021/08/23
 *
 */
import { parseDocs } from './generate-vue-docs'
import * as os from 'os'
import * as common from './common'
const br = os.EOL //换行符

//分组缓存
export interface groupCache {
  [cacheKey: string]: {
    groupKey: string
    count: number
    group: Array<object>
    [key: string]: any
  }
}

/**
 * 根据指定属性分类
 * @param {Array} arr 指定数组
 * @param {String} groupKey //分类依据
 * @returns {Object} 分类结果
 */
function groupBy(arr: Array<Record<string, any>>, groupKey: string) {
  const cache = {} as groupCache
  if (common.getDataType(arr) !== 'Array') {
    throw new Error('非数组类型，无法分类')
  }
  arr.forEach((element) => {
    if (cache[element[groupKey]]) {
      cache[element[groupKey]].group.push(element)
      cache[element[groupKey]].count++
    } else {
      cache[element[groupKey]] = {
        groupKey,
        count: 1,
        group: [element],
        ...element
      }
    }
  })
  return cache
}

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
  } else {
    if ((queryResult = queryReg.exec(content))) {
      str +=
        customHandel && typeof customHandel === 'function'
          ? customHandel(queryResult)
          : queryResult[matchIndex] + br
    }
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
    console.log('空文本内容')
    return content
  }
  let result = Array.from(new Set(match))
  result = result.filter((item) => item.match(/[\S]/)) //去除空白行
  let str = ''
  let title = ''
  switch (mode) {
    case 'txtToMd':
      result = result.map((item, index) => {
        item = item.trim()
        if ((index + 1) % 2 === 0) {
          return `${item}${br}` //额外添加行间距
        }
        return `> ${(index + 2) / 2}. **${item}**  `
      })
      title = `## 摘自百度翻译(good good study,day day up)` + br
      str = title + result.join(br)
      break
    case 'txtToTxt':
      console.log(result.length / 2)
      result = result.map((item, index) => {
        item = item.trim()
        if ((index + 1) % 2 === 0) {
          return `${item}${br}` //额外添加行间距
        }
        return item
      })
      str = result.join(br)
      break
    default:
      console.log(result.length) //输出行结果
      result = result.map((item) => {
        item = item.trim()
        return item
      })
      str = title + result.join(br)
  }
  return str
}

/**
 * 对对象内部属性排序
 * @param {Object} target
 * @returns {Object} 属性排序后对象
 */
function sortObjAttr(target: Record<string, any>) {
  const dataType = common.getDataType(target)
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

/**
 * 数组排序
 * @param {Array} arr 原数组
 * @param {Function|string} customSort 自定义排序规则
 * @returns {Array} 排序后数组
 */
function sortArray(arr: Array<Record<string, any>>, customSort: Function | string) {
  const dataType = common.getDataType(arr)
  if (dataType !== 'Array') {
    throw new Error('sortArray数据类型错误')
  }
  return arr.sort((a, b) => {
    if (typeof customSort === 'function') {
      return customSort(a, b)
    }
    if (typeof customSort === 'string') {
      return a[customSort].localeCompare(b[customSort])
    }
  })
}

/**
 * 创建属性描述表格
 * @param {*} attrGroup //属性描述分组后对象
 * @returns {String} 带首字母索引的属性描述表格字符串
 */
function createdAttributesGroupTable(attrGroup: Record<string, any>) {
  const dataType = common.getDataType(attrGroup)
  if (dataType !== 'Object') {
    throw new Error('createdAttributesGroupTable数据类型错误')
  }
  attrGroup = sortObjAttr(attrGroup)
  let attributesDescriptionTable = ''
  for (const attrGroupItem of Object.values(attrGroup)) {
    if (Reflect.get(attrGroupItem, 'groupKey') && Reflect.get(attrGroupItem, 'group')) {
      const title = Reflect.get(attrGroupItem.group[0], attrGroupItem.groupKey)
      attributesDescriptionTable += `## ${title}` + br
      attributesDescriptionTable += `|字段|描述|` + br
      attributesDescriptionTable += `|-|-|` + br
      const group = sortArray(attrGroupItem.group, 'key')
      for (const groupItem of group) {
        attributesDescriptionTable += `${groupItem.key}|${groupItem.value}|` + br
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
  const dataType = common.getDataType(stateInStore)
  if (dataType !== 'Object') {
    throw new Error('createdStoreTable数据类型错误')
  }
  stateInStore = sortObjAttr(stateInStore)
  let createdStoreTableStr = ''
  if (typeof stateInStore !== 'object') {
    return ''
  }
  if (stateInStore.title) {
    createdStoreTableStr += `### ${stateInStore.title}` + br
  }
  if (leavl === 1) {
    createdStoreTableStr += `## root` + br
  }
  createdStoreTableStr += `|字段|类型|默认|注释|` + br
  createdStoreTableStr += `|-|-|-|-|` + br
  for (const key in stateInStore) {
    const type = common.getDataType(stateInStore[key])
    const value = JSON.stringify(stateInStore[key])
    const descript = annotationObj[key] || ''
    if (type === 'Object' && Object.keys(stateInStore[key]).length) {
      const storeModule = stateInStore[key]
      storeModule.title = key
      const nextLeavl = leavl + 1
      if (nextLeavl <= 2) {
        createdStoreTable(storeModule, annotationObj, nextLeavl, cache)
      }
    } else {
      createdStoreTableStr += `${key}|${type}|${value}|${descript}|` + br
    }
  }
  if (leavl === 1) {
    cache.unshift(createdStoreTableStr) //添加根记录
  } else {
    cache.push(createdStoreTableStr)
  }
  return cache.join(br)
}

export default {
  groupBy,
  queryContentByReg,
  sortObjAttr,
  textFormat,
  createdAttributesGroupTable,
  createdStoreTable,
  parseDocs
}
