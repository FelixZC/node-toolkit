import { randomBytes } from 'crypto'

export function generateSimpleRandomString(): string {
  const randomPart = Math.floor((1 + Math.random()) * 0x10000).toString(16)
  return randomPart
}
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomChar = characters.charAt(Math.floor(Math.random() * characters.length))
    result += randomChar
  }
  return result
}
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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
