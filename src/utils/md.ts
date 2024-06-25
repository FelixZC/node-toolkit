import { getDataType, sortArray, sortObjAttr } from './common'
/**
 * Markdown 文件生成工具类，持续完善中...
 * @author pzc
 * @date 2021/08/23
 */

import * as os from 'os'
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
  // 参数验证
  if (typeof content !== 'string') {
    throw new Error('Content must be a string.')
  }
  if (!(queryReg instanceof RegExp)) {
    throw new Error('QueryReg must be a RegExp object.')
  }
  if (typeof matchIndex !== 'number') {
    throw new Error('MatchIndex must be a number.')
  }
  if (customHandel && typeof customHandel !== 'function') {
    throw new Error('CustomHandel must be a function.')
  }
  let queryResult
  let str = ''

  // 确保正则表达式用于全局搜索
  if (!queryReg.global) {
    queryReg = new RegExp(queryReg.source, queryReg.flags + 'g')
  }
  let lastIndex = 0 // 记录上次匹配的结束位置
  while ((queryResult = queryReg.exec(content))) {
    // 处理匹配结果
    const resultStr = customHandel ? customHandel(queryResult) : queryResult[matchIndex]
    str += resultStr
    if (queryResult[0].length === 0) {
      lastIndex = queryReg.lastIndex // 避免无限循环
      queryReg.lastIndex++ // 移动 lastIndex 以避免空匹配
    } else {
      lastIndex = queryReg.lastIndex
    }
    // 确保不会重复添加 br
    if (lastIndex < content.length) {
      str += br
    }
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
      attributesDescriptionTable += `|字段|描述|位置|${br}`
      attributesDescriptionTable += `|-|-|-|${br}`
      const group = sortArray(attrGroupItem.group, { fields: ['key'] })
      for (const groupItem of group) {
        const [name, position] = groupItem.key.split('->')
        const description = groupItem.value
        attributesDescriptionTable += `${name}|${description}|${position}|${br}`
      }
    }
  }
  return attributesDescriptionTable
}

/**
 * @deprecated
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
interface NodeWithId {
  base: string
  comment?: string
  children?: NodeWithId[]
}

/**
 * 生成项目结构树的字符串表示。
 *
 * @param nodes 节点数组，每个节点包含一个id和基础名称。
 * @param level 当前处理的层级，默认为0，表示根层级。
 * @param isLevelLastNode 一个布尔数组，表示每个层级的最后一个节点的标记，默认为空数组。
 * @returns 返回项目结构树的字符串。
 */
function generateProjectTree(
  nodes: NodeWithId[],
  level: number = 0,
  isLevelLastNode: boolean[] = []
): string {
  let treeString = ''
  nodes.forEach((node, index, array) => {
    // 复制isLevelLastNode数组，以避免在递归调用中修改原始数组
    const isLevelLastNodeClone: boolean[] = [...isLevelLastNode]
    let connector
    // 根据层级和当前节点是否是本层级的最后一个节点，确定连接符
    if (level === 0) {
      connector = '  '
    } else {
      connector = index === array.length - 1 ? '╰─ ' : '├─ '
    }
    let padding = ''
    // 根据isLevelLastNodeClone的值生成当前节点的前缀空白或竖线，以形成树的结构
    for (const isLevelLastNode of isLevelLastNodeClone) {
      if (isLevelLastNode) {
        padding += ' '.repeat(4)
      } else {
        padding += '│' + ' '.repeat(3)
      }
    }
    // 如果节点有注释，则在节点名称后添加注释
    if (node.comment) {
      treeString += `${padding}${connector}${node.base} //${node.comment}\n`
    } else {
      treeString += `${padding}${connector}${node.base}\n`
    }
    // 标记当前层级的最后一个节点
    isLevelLastNodeClone[level] = index === array.length - 1
    // 如果节点有子节点，则递归生成子节点的树结构
    if (node.children && node.children.length > 0) {
      treeString += generateProjectTree(node.children, level + 1, isLevelLastNodeClone)
    }
  })
  return treeString
}
export default {
  createdAttributesGroupTable,
  createdStoreTable,
  queryContentByReg,
  generateProjectTree
}
