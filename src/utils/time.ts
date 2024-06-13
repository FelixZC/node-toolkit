// 定义 YYYYMMDDHHMMSS 格式的类型
type YYYYMMDDHHMMSS = string

// 定义 getFormattedTimestamp 函数
export const getFormattedTimestamp: () => YYYYMMDDHHMMSS = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  // 拼接成 YYYYMMDDHHMMSS 格式的字符串
  return `${year}${month}${day}${hours}${minutes}${seconds}` as YYYYMMDDHHMMSS
}

export function getCurrentDateFormatted() {
  const date = new Date()
  const year = date.getFullYear() // 获取四位数的年份
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // 获取月份，加1因为月份是从0开始的
  const day = date.getDate().toString().padStart(2, '0') // 获取日

  return `${year}-${month}-${day}` // 返回格式化的日期字符串
}
