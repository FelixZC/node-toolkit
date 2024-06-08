import path from 'path'
import * as os from 'os'
import * as fs from 'fs'

const eol = os.EOL // 换行符
const userInfo = os.userInfo() // 用户信息
const logPath = path.join(process.cwd(), 'operate.log')

if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, '') // 创建空文件
}

interface LogRecord {
  methodName: string
  arguments: unknown[]
  timestamp: Date
  result: any
  user: string
}

interface ErrorRecord {
  methodName: string
  arguments: unknown[]
  error: {
    message: string | undefined
    stack: string | undefined
  }
  timestamp: Date
  user?: string
}

function saveOperateLog(record: LogRecord | ErrorRecord) {
  const content = `${JSON.stringify(record)}${eol}${new Array(100).fill('-').join('-')}${eol}`
  fs.appendFileSync(logPath, content)
}

export function logDecorator() {
  return function (target: any, name: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value // 保存原始方法引用
    descriptor.value = function (...args: unknown[]) {
      try {
        const result = originalMethod.apply(this, args)
        const logRecord: LogRecord = {
          methodName: name,
          arguments: args,
          timestamp: new Date(),
          result,
          user: userInfo.username
        }
        saveOperateLog(logRecord)
        return result
      } catch (error) {
        // 确保 error 是 Error 类型的实例
        const typedError = error as Error
        const errorRecord: ErrorRecord = {
          methodName: name,
          arguments: args,
          error: {
            message: typedError?.message,
            stack: typedError?.stack
          },
          timestamp: new Date(),
          user: userInfo.username
        }
        saveOperateLog(errorRecord)
        throw typedError // 重新抛出错误
      }
    }
    return descriptor
  }
}
