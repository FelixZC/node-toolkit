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
