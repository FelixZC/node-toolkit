import * as fs from 'fs'
import * as path from 'path' //

/**
 * 获取数据类型
 * @param {any} obj
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
 * 检查路径有效性
 * @param filePath
 */

export const checkPathVaild = (filePath: string) => {
  try {
    fs.accessSync(filePath, fs.constants.F_OK)
  } catch {
    const dirPath = path.dirname(filePath)
    fs.mkdirSync(dirPath, {
      recursive: true
    })
  }
}
/**
 * 写入文件内容
 * @param filePath
 * @param content
 */

export const writeFile = (filePath: string, content: string) => {
  checkPathVaild(filePath)
  fs.writeFileSync(filePath, content, 'utf-8')
}
/**
 * 对对象内部属性排序
 * @param {Object} target
 * @returns {Object} 属性排序后对象
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
 * @param {Array} arr 原数组
 * @param {Function|string} customSort 自定义排序规则
 * @returns {Array} 排序后数组
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
} // 分组缓存

export interface GroupCache<T> {
  [cacheKey: string]: {
    groupKey: string
    count: number
    group: Array<T>
    [key: string]: any
  }
}
/**
 * 根据指定属性分类
 * @param {Array} arr 指定数组
 * @param {String} groupKey //分类依据
 * @returns {Object} 分类结果
 */

export function groupBy<T extends Record<string, any>>(arr: T[], groupKey: string) {
  const cache = {} as GroupCache<T>

  if (getDataType(arr) !== 'Array') {
    throw new Error('非数组类型，无法分类')
  }

  arr.forEach((element) => {
    const cacheKey = element[groupKey]

    if (cache[cacheKey]) {
      cache[cacheKey].group.push(element)
      cache[cacheKey].count++
    } else {
      cache[cacheKey] = {
        count: 1,
        group: [element],
        groupKey,
        ...element
      }
    }
  })
  return cache
}
/**
 * 驼峰转化-
 * @param str
 * @returns
 */

export const kebabCase = function (str: string) {
  const hyphenateRE = /([^-])([A-Z])/g
  return str.replace(hyphenateRE, '$1-$2').replace(hyphenateRE, '$1-$2').toLowerCase()
}
export const easeUnline = function (str: string) {
  const easeReg2 = /^[_-]/g
  return str.replace(easeReg2, '')
}
/**
 * 首字母大写
 * @param str
 * @returns
 */

export const capitalize = function (str: string) {
  if (typeof str !== 'string') return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}
/**
 * 判断是否为引用路径
 * @param str
 * @returns
 */

export const isPath = (str: string) => {
  const startsWithList: string[] = ['@', 'src', 'images', 'img', 'styles', '~', '../', './', 'dist']

  for (const tag of startsWithList) {
    if (str.startsWith(tag)) {
      return true
    }
  }

  return false
}
/**
 * 转化导入路径引用驼峰规则
 * @param str
 * @param seperator
 * @returns
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

      /** to stupid to continue  */

      /** this is situation one  */

      if (!result.includes('-') && item !== result) {
        result = '_' + result
      }
      /** this is situation two,exec after one ，also you can skip them */
      // result = easeUnline(result)

      return result
    })
    .join(seperator)
}

/**
 * 执行string代码,存在无效引用则报错
 * @param str
 * @returns
 */
export function strToJson(str: string) {
  const json = eval('(' + str + ')')
  return json
}

/**
 * 设置嵌套对象属性
 * @param target
 * @param keys
 * @param value
 */

export const setValueByKeys = (
  target: Record<string, any> = {},
  keys: string[] | string,
  value: any
) => {
  if (typeof keys === 'string') {
    keys = keys.split(',')
  }

  keys.reduce((previousValue, currentKey, currentIndex) => {
    if (currentIndex === keys.length - 1) {
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
 * 获取嵌套对象属性
 * @param target
 * @param keys
 */

export const getValueByKeys = (target: Record<string, any> = {}, keys: string[] | string): any => {
  if (typeof keys === 'string') {
    keys = keys.split(',')
  }

  return keys.reduce((previousValue, currentKey) => {
    return previousValue?.[currentKey]
  }, target)
}
