import * as fs from 'fs'
import * as path from 'path' //

/**
 * 首字母大写
 * @param str
 * @returns
 */

export const upperFirstletter = (str: string) => {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}
/**
 * 获取数据类型
 * @param {any} obj
 * @returns {String} 数据构造器对应字符串
 */

export const getDataType = (obj: object) => {
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
      recursive: true,
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
