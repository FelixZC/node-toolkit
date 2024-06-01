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

// 定义分组缓存接口
export interface GroupCache<T> {
  [cacheKey: string]: {
    groupKey: string
    count: number
    group: Array<T>
    [key: string]: any
  }
}

/**
 * 根据指定属性对数组元素进行分类
 * @param {Array} arr - 指定数组
 * @param {String} groupKey - 分类依据的属性名
 * @returns {Object} 分类结果对象
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
 * 判断是否为引用路径（如 '@', 'src', 'images', 'img', 'styles', '~', '../', './', 'dist' 开头的字符串）
 * @param {string} str - 待判断的字符串
 * @returns {boolean} 是否为引用路径
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
      /** to stupid to continue  */
      /** this is situation one  */

      if (!result.includes('-') && item !== result) {
        result = '_' + result
      }

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
