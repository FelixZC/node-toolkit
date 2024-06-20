import dayjs from 'dayjs' // 引入 Day.js 库

// 定义 YYYYMMDDHHMMSS 格式的类型
type YYYYMMDDHHMMSS = string

// 使用 Day.js 获取格式化的时间戳
export const getFormattedTimestamp: () => YYYYMMDDHHMMSS = () => {
  return dayjs().format('YYYYMMDDHHmmss')
}

// 使用 Day.js 获取格式化的日期
export function getCurrentDateFormatted(): string {
  return dayjs().format('YYYY-MM-DD')
}

// 获取当前时间的 Unix 时间戳（单位：秒）
export function getCurrentTimestamp(): number {
  return dayjs().unix()
}

// 获取当前日期的前一天的格式化日期
export function getPreviousDateFormatted(): string {
  return dayjs().subtract(1, 'day').format('YYYY-MM-DD')
}

// 获取当前日期的后一天的格式化日期
export function getNextDateFormatted(): string {
  return dayjs().add(1, 'day').format('YYYY-MM-DD')
}

// 检查提供的日期字符串是否是有效日期
export function isValidDate(dateString: string): boolean {
  return dayjs(dateString).isValid()
}

// 获取两个日期之间的差异，以天为单位
export function getDateDifference(dateString1: string, dateString2: string): number {
  return dayjs(dateString2).diff(dayjs(dateString1), 'day')
}

// 格式化日期时间，包含时间
export function getFormattedDateTime(): string {
  return dayjs().format('YYYY-MM-DDTHH:mm:ss')
}

export function getFirstDateOfMonthFormatted(): string {
  return dayjs().startOf('month').format('YYYY-MM-DD')
}

// 获取当前日期的月份的最后一天
export function getLastDateOfMonthFormatted(): string {
  return dayjs().endOf('month').format('YYYY-MM-DD')
}

// 格式化传入日期时间，包含时间
export function formatInputDateTime(input: Date): string {
  return dayjs(input).format('YYYY/MM/DD HH:mm:ss')
}
