import { createLogger, format, transports, Logger as WinstonLogger } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { app } from 'electron'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs-extra'
import { getCurrentDateFormatted } from './time'
// import express, { Request, Response, NextFunction } from 'express';
const userInfo = os.userInfo()
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

let logDirectory = path.join(app.getPath('userData'), 'logs')

fs.ensureDirSync(logDirectory)

export const getFilename = () => {
  return `operate-${getCurrentDateFormatted()}.log`
}
export const getLogPath = () => {
  return path.join(logDirectory, getFilename())
}

// 创建 Winston 日志器实例
export const logger: WinstonLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      format: format.simple()
    }),
    new DailyRotateFile({
      filename: 'operate-%DATE%.log',
      dirname: logDirectory,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format: format.combine(format.timestamp(), format.json())
    }),
    new transports.File({
      filename: 'error.log',
      dirname: logDirectory,
      level: 'error',
      format: format.combine(format.timestamp(), format.json())
    })
  ]
})

function saveOperateLog(record: LogRecord | ErrorRecord) {
  const { methodName, arguments: args, timestamp, ...rest } = record
  const logMessage = `${methodName} called at ${timestamp.toISOString()} with arguments: ${JSON.stringify(
    args
  )}`
  if ('result' in rest) {
    logger.info(logMessage, { ...rest })
  } else {
    logger.error(logMessage, { ...rest })
  }
}

export function logDecorator(target: any, name: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value
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
      throw error
    }
  }
  return descriptor
}

// 异常处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', promise, 'reason:', reason)
})
/************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************ */
// HTTP 请求日志中间件
// const app = express();
// const port = 3000; // 你可以根据需要更改端口
// // 中间件，记录每个请求
// app.use((req: Request, res: Response, next: NextFunction) => {
//   logger.info(`接收到 ${req.method} 请求：${req.originalUrl}`);
//   next();
// });

// // 路由，响应根路径
// app.get('/', (req: Request, res: Response) => {
//   res.send('Hello, World!');
// });

// // 错误处理中间件
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   logger.error(`服务器错误：${err.message}`);
//   res.status(500).send('服务器遇到错误，请稍后再试。');
// });

// // 监听端口
// app.listen(port, () => {
//   logger.info(`服务器正在监听 http://localhost:${port}`);
// });
/************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************ */
