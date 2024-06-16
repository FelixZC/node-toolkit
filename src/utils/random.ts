import { randomBytes } from 'crypto'

/**
 * 生成一个简单的随机字符串。
 *
 * @returns {string} 一个由十六进制字符组成的随机字符串。
 */
export function generateSimpleRandomString(): string {
  const randomPart = Math.floor((1 + Math.random()) * 0x10000).toString(16)
  return randomPart
}

/**
 * 生成指定长度的随机字符串。
 *
 * @param {number} length 随机字符串的长度。
 * @returns {string} 由指定长度的字母、数字组成的随机字符串。
 */
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomChar = characters.charAt(Math.floor(Math.random() * characters.length))
    result += randomChar
  }
  return result
}

/**
 * 生成一个UUID（通用唯一标识符）。
 *
 * @returns {string} 符合UUID格式的字符串。
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 生成一个加密安全的随机字符串。
 *
 * 使用crypto模块的randomBytes方法来生成随机字节，然后将这些字节转换为一个字符串，
 * 以提供更高的安全性。这个方法确保了生成的字符串可以在URLs和其他需要安全随机数的场景中使用。
 *
 * @param {number} length 随机字符串的长度。
 * @returns {string} 一个加密安全的随机字符串。
 */
export function generateCryptoSafeRandomString(length: number): string {
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    const charCode = bytes[i] % 62 // 62 个字符：10 数字，26 大写字母，26 小写字母
    result +=
      charCode > 10
        ? charCode > 36
          ? String.fromCharCode(charCode - 4)
          : charCode.toString(36).toUpperCase()
        : charCode.toString(10)
  }
  return result
}
