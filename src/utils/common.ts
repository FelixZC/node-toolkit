import * as mime from 'mime-types'
import { FileType } from '@src/types/file'
import { message } from 'antd'
/**
 * 获取数据类型
 * @param {any} obj - 任意待检测的数据
 * @returns {String} 数据构造器对应字符串
 * | 'Undefined'
   | 'Null'
   | 'Date'
   | 'String'
   | 'Math'
   | 'Number'
   | 'Boolean'
   | 'Object'
   | 'Array'
   | 'Function'
 */
export const getDataType = (obj: any) => {
  return Object.prototype.toString.call(obj).slice(8, -1)
}

/**
 * 对对象内部属性排序
 * @param {Object} target - 待排序的对象
 * @returns {Object} 属性排序后的新对象
 */
export function sortObjAttr(target: Record<string, any>) {
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

/**
 * 数组排序
 * @param {Array} arr - 原数组
 * @param {Function|string} customSort - 自定义排序规则，可以是比较函数或基于对象属性的字符串键名
 * @returns {Array} 排序后的新数组
 */
export function sortArray(arr: Array<Record<string, any>>, customSort: Function | string) {
  const dataType = getDataType(arr)
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

interface GroupCache<T> {
  [key: string]: {
    count: number
    group: T[]
    groupKey: string
  }
}

export function groupBy<T extends Record<string, any>>(arr: T[], groupKey: string): GroupCache<T> {
  if (!Array.isArray(arr)) {
    throw new Error('非数组类型，无法分类')
  }
  const cache = {} as GroupCache<T>
  arr.forEach((element) => {
    if (!element.hasOwnProperty(groupKey)) {
      throw new Error(`元素缺少分组键：${groupKey}`)
    }
    const cacheKey = element[groupKey]
    if (cache[cacheKey]) {
      cache[cacheKey].group.push(element)
      cache[cacheKey].count++
    } else {
      cache[cacheKey] = {
        count: 1,
        group: [element],
        groupKey
      }
    }
  })
  return cache
}

/**
 * 驼峰式字符串转短横线分隔
 * @param {string} str - 驼峰式字符串
 * @returns {string} 短横线分隔的字符串
 */
export const kebabCase = function (str: string) {
  const hyphenateRE = /([^-])([A-Z])/g
  return str.replace(hyphenateRE, '$1-$2').replace(hyphenateRE, '$1-$2').toLowerCase()
}

/**
 * 移除字符串开头的下划线和连字符
 * @param {string} str - 输入字符串
 * @returns {string} 处理后的字符串
 */
export const easeUnline = function (str: string) {
  const easeReg2 = /^[_-]/g
  return str.replace(easeReg2, '')
}

/**
 * 首字母大写
 * @param {string} str - 输入字符串
 * @returns {string} 首字母大写的字符串
 */
export const capitalize = function (str: string) {
  if (typeof str !== 'string') return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 判断给定的字符串是否为引用路径。
 * 引用路径是那些以特定前缀（如 '@', 'src', 'images', 'img', 'styles', '~', '../', './', 'dist' 等）开头的字符串。
 * @param {string} str - 待判断的字符串
 * @returns {boolean} 是否为引用路径
 */
export const isPath = (str: string): boolean => {
  const startsWithList: string[] = [
    'src',
    '@',
    '@src',
    'images',
    'img',
    'styles',
    '~',
    '../',
    './',
    '/',
    'dist',
    'node_modules',
    'assets',
    'components',
    'utils',
    'scripts',
    'lib',
    'public'
    // 其他可能的引用路径前缀...
  ]

  // 检查 str 是否以 startsWithList 中的任何一个字符串开头
  return startsWithList.some((prefix) => str.startsWith(prefix))
}

/**
 * 转化导入路径引用为驼峰规则，使用指定分隔符
 * @param {string} str - 输入字符串
 * @param {string} seperator - 分隔符，默认为 '/'
 * @returns {string} 转化后的字符串
 */
export const transferRef = (str: string, seperator = '/') => {
  if (!str) {
    return str
  }
  return str
    .split(seperator)
    .map((item) => {
      let result = kebabCase(item)
        .replace(/[_-]{2}/g, '-')
        .replace(/(['"`/\\])-/g, '$1')
        .replace(/(\b\w\b)-(?=\b\w\b)/g, '$1')

      /** 当代码管理工具和window组合使用，会出现文件大小写同源问题 */
      /** too stupid to continue  */
      /** this is situation one  */
      // if (!result.includes('-') && item !== result) {
      //   result = '_' + result
      // }
      /** this is situation two,exec after one ，also you can skip them */
      // result = easeUnline(result);

      return result
    })
    .join(seperator)
}

/**
 * 执行字符串形式的 JavaScript 代码，存在无效引用时会报错
 * @param {string} str - 要执行的 JavaScript 代码字符串
 * @returns {any} 代码执行结果
 */
export function strToJson(str: string) {
  const json = eval('(' + str + ')')
  return json
}

/**
 * 设置嵌套对象属性值
 * @param {Record<string, any>} target - 目标对象
 * @param {string[] | string} keys - 属性路径，可以是逗号分隔的字符串或键名数组
 * @param {any} value - 要设置的属性值
 */
export const setValueByKeys = (
  target: Record<string, any> = {},
  keys: string[] | string,
  value: any
) => {
  let localKeys = keys
  if (typeof localKeys === 'string') {
    localKeys = localKeys.split(',')
  }
  localKeys.reduce((previousValue, currentKey, currentIndex) => {
    if (currentIndex === localKeys.length - 1) {
      previousValue[currentKey] = value
    } else {
      return (
        previousValue?.[currentKey] ||
        Object.defineProperty({}, currentKey, {
          value: {}
        })
      )
    }
  }, target)
}

/**
 * 获取嵌套对象属性值
 * @param {Record<string, any>} target - 目标对象
 * @param {string[] | string} keys - 属性路径，可以是逗号分隔的字符串或键名数组
 * @returns {any} 指定路径的属性值，若不存在则返回 undefined
 */
export const getValueByKeys = (target: Record<string, any> = {}, keys: string[] | string): any => {
  let localKeys = keys
  if (typeof localKeys === 'string') {
    localKeys = localKeys.split(',')
  }
  return localKeys.reduce((previousValue, currentKey) => {
    return previousValue?.[currentKey]
  }, target)
}

interface NodeWithId {
  id?: string | number
  parentId?: string | number | null
  children?: NodeWithId[]
}
export function buildTree<T extends NodeWithId>(
  nodes: T[],
  idProp: keyof T,
  parentProp: keyof T
): T[] {
  const nodeMap: {
    [key: string]: T
  } = {}
  const rootNodes: T[] = []

  // 初始化节点映射
  nodes.forEach((node) => {
    const nodeId = String(node[idProp]) // 确保 id 是字符串
    nodeMap[nodeId] = {
      ...node,
      children: node.children || [] // 初始化子节点数组
    }
  })

  // 构建树结构
  nodes.forEach((node) => {
    const parentId = String(node[parentProp]) // 确保 parentId 是字符串
    if (parentId && nodeMap[parentId]) {
      // 如果存在父节点，则将当前节点添加到父节点的子节点中
      nodeMap[parentId].children?.push(nodeMap[String(node[idProp])])
    } else {
      // 如果没有父节点，则认为是根节点
      rootNodes.push(nodeMap[String(node[idProp])])
    }
  })
  return rootNodes // 返回根节点数组
}

export function pickProperties<T extends object, K extends keyof T>(
  objects: T[],
  propertiesToKeep: K[]
): Pick<T, K>[] {
  return (Array.isArray(objects) ? objects : [objects]).map((obj) => {
    const picked: any = {}
    for (const propertyKey of propertiesToKeep) {
      const value = obj[propertyKey]
      // 如果属性是对象且存在，则递归调用pickProperties
      if (value && typeof value === 'object') {
        // 这里假设嵌套对象的键也在 propertiesToKeep 中
        picked[propertyKey] = pickProperties(value as T[], propertiesToKeep)
      } else {
        // 否则，直接复制属性值
        picked[propertyKey] = value
      }
    }
    // 确保返回的对象类型是 Pick<T, K>
    return picked as Pick<T, K>
  })
}
export const getIgnorePatterns = (str: string): RegExp[] => {
  // 将排除文件列表转换为正则表达式数组
  const ignoreFilesPatterns = str
    .split(',')
    .map((pattern) => pattern.trim())
    .filter((pattern) => pattern.length)
    .map((pattern) => {
      // 转义正则表达式中的特殊字符，除了星号（*）之外
      let escapedPattern = escapeReg(pattern)
      // 替换星号（*）为正则表达式中的量词 .*，表示匹配任意字符任意次
      escapedPattern = escapedPattern.replace(/\*/g, '.*')
      // 创建正则表达式对象
      return new RegExp(escapedPattern)
    })
  return ignoreFilesPatterns
}

export const escapeReg = (string: string) => {
  // 转义正则表达式中的特殊字符，包括 -
  return string.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
}

export const convertToReg = (
  query: string,
  matchReg: boolean,
  matchCase: boolean,
  matchWholeWord: boolean,
  matchGlobal?: boolean
) => {
  if (!query.length) {
    return null
  }
  // 如果是使用正则表达式，直接创建，否则需要转义查询字符串以避免特殊字符
  const pattern = matchReg ? query : escapeReg(query)

  // 构建正则表达式字符串
  let regExpString = matchWholeWord ? `\\b${pattern}\\b` : pattern

  // 默认全局搜索
  let flags = ''
  if (matchGlobal) {
    flags += 'g'
  }
  // 如果不区分大小写，则添加 'i' 标志
  if (!matchCase) {
    flags += 'i'
  }
  try {
    // 创建正则表达式对象，需要将模式和标志作为两个参数传递
    return new RegExp(regExpString, flags)
  } catch (error) {
    console.error('Invalid regular expression:', regExpString, flags)
    return null
  }
}

function mimeTypeToFileType(mimeType: string): FileType {
  // 移除可能的参数，只保留基本 MIME 类型
  const baseMimeType = mimeType.split(';')[0].trim().toLowerCase()

  // 根据 MIME 类型的基本部分进行分类
  switch (true) {
    case baseMimeType.startsWith('audio/'):
      return 'Audio'
    case baseMimeType.startsWith('video/'):
      return 'Video'
    case baseMimeType.startsWith('image/'):
      return 'Image'
    case baseMimeType.startsWith('text/') || baseMimeType === 'application/xml':
      return 'Plain Text'
    case baseMimeType === 'application/pdf':
      return 'Document' // 单独处理 PDF
    case baseMimeType.startsWith('application/'):
      if (baseMimeType.startsWith('application/font') || baseMimeType.endsWith('+x-woff')) {
        return 'Font'
      } else if (baseMimeType.includes('font/') || baseMimeType.endsWith('+x-woff')) {
        return 'Font' // 处理 WOFF 字体
      } else if (
        baseMimeType.endsWith('x-tar') ||
        baseMimeType.endsWith('zip') ||
        baseMimeType.endsWith('x-rar-compressed') ||
        baseMimeType.endsWith('x-7z-compressed')
      ) {
        return 'Archive' // 处理归档文件
      } else {
        return 'Application' // 其他 application 类型
      }
    case baseMimeType.startsWith('application/x-msdownload') ||
      baseMimeType.startsWith('application/x-ms-') ||
      baseMimeType.endsWith('x-msdownload') ||
      baseMimeType.startsWith('application/x-executable') ||
      baseMimeType.startsWith('application/x-elf') ||
      baseMimeType.endsWith('x-mach-o'):
      return 'Executable' // 处理 Windows 可执行文件
    default:
      return 'Other' // 默认类别
  }
}

export function classifyFileMimeType(ext: string): FileType {
  const mimeType = mime.lookup(ext)
  if (mimeType) {
    return mimeTypeToFileType(mimeType)
  }
  return 'Other'
}

export function formatFileSize(bytes: number, decimalPlaces = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimalPlaces < 0 ? 0 : decimalPlaces
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

type SortOrder = 'ascend' | 'descend'

export const compare = (
  a: Record<string, any>,
  b: Record<string, any>,
  order: SortOrder,
  fields: string[]
) => {
  let result = 0
  if (!order) {
    return 0
  }
  fields.forEach((field) => {
    if (result === 0) {
      // 仅在前面的比较结果相同的情况下比较下一个字段
      const aValue = a[field]
      const bValue = b[field]
      if (aValue < bValue) {
        result = -1
      } else if (aValue > bValue) {
        result = 1
      }
    }
  })
  return order === 'ascend' ? result : -result
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      message.success('复制成功')
    } catch (err) {
      message.error('复制失败')
    }
  } else {
    console.error('Clipboard API 不可用')
  }
}

export function getArrayDepth<T>(arr: T[]): number {
  if (arr.length === 0) {
    return 1 // 空数组的深度为1
  }

  let maxDepth = 1 // 初始深度为1

  // 遍历数组中的每个元素
  arr.forEach((element: T) => {
    // 检查元素是否是数组
    if (Array.isArray(element)) {
      // 递归调用getArrayDepth，计算子数组的深度
      const depth = getArrayDepth(element)
      // 更新最大深度
      maxDepth = Math.max(maxDepth, depth)
    }
  })

  // 加上当前层级
  return maxDepth + 1
}
