import { app } from "electron";
import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { getCurrentDateFormatted } from "./time";
import * as os from "os";
import * as path from "path";

// 日志记录接口
interface LogRecord {
  methodName: string;
  arguments: unknown[];
  timestamp: Date;
  result: any;
  user: string;
}
interface ErrorRecord {
  methodName: string;
  arguments: unknown[];
  error: {
    message: string | undefined;
    stack: string | undefined;
  };
  timestamp: Date;
  user?: string;
}
export class Logger {
  private static instance: WinstonLogger | null = null;
  private constructor() {}

  // 私有方法，用于创建logger实例
  private static createInstance(): WinstonLogger {
    return createLogger({
      level: "info",
      format: format.combine(
        format.timestamp(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
      transports: [
        new transports.Console({
          format: format.simple(),
        }),
        new DailyRotateFile({
          filename: "operate-%DATE%.log",
          dirname: Logger.getLogDirectory(),
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          level: "info",
          format: format.combine(format.timestamp(), format.json()),
        }),
        new transports.File({
          filename: "error.log",
          dirname: Logger.getLogDirectory(),
          level: "error",
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
    });
  }

  // 公共静态方法，用于获取logger实例
  public static getInstance(): WinstonLogger {
    if (!Logger.instance) {
      Logger.instance = Logger.createInstance();
    }
    return Logger.instance;
  }

  // 其他静态方法
  public static getFilename() {
    return `operate-${getCurrentDateFormatted()}.log`;
  }
  public static getLogDirectory() {
    return process.env.NODE_ENV === "production"
      ? path.join(app.getPath("userData"), "logs")
      : path.join(process.cwd(), "logs");
  }
  public static getLogPath() {
    const logDirectory = Logger.getLogDirectory();
    return path.join(logDirectory, Logger.getFilename());
  }
}

// 保存操作日志的函数
export function saveOperateLog(record: LogRecord | ErrorRecord) {
  const { methodName, arguments: args, timestamp, ...rest } = record;
  const logMessage = `${methodName} called at ${timestamp.toISOString()} with arguments: ${JSON.stringify(args)}`;
  const loggerInstance = Logger.getInstance();
  if ("result" in rest) {
    loggerInstance.info(logMessage, {
      ...rest,
    });
  } else {
    loggerInstance.error(logMessage, {
      ...rest,
    });
  }
}

// 日志装饰器
export function logDecorator(
  target: any,
  name: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;
  const userInfo = os.userInfo();
  descriptor.value = function (...args: unknown[]) {
    try {
      const result = originalMethod.apply(this, args);
      const logRecord: LogRecord = {
        methodName: name,
        arguments: args,
        timestamp: new Date(),
        result,
        user: userInfo.username,
      };
      saveOperateLog(logRecord);
      return result;
    } catch (error) {
      const typedError = error as Error;
      const errorRecord: ErrorRecord = {
        methodName: name,
        arguments: args,
        error: {
          message: typedError.message,
          stack: typedError.stack,
        },
        timestamp: new Date(),
        user: userInfo.username,
      };
      saveOperateLog(errorRecord);
      throw error;
    }
  };
  return descriptor;
}
