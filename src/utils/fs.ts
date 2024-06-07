import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import type { UserInfo } from 'os'
const userInfo = os.userInfo() // 用户信息
const eol = os.EOL // 换行符

// 定义操作日志记录的结构
interface LogRecord {
  methodName: string
  arguments: unknown[]
  timestamp: Date
}

// 定义异常日志记录的结构
interface ErrorRecord {
  methodName: string
  arguments: unknown[]
  error: {
    message: string
    stack?: string
  }
  timestamp: Date
}

/**
 * 检查路径有效性
 * @param filePath - 要检查的文件路径
 */
export const checkPathValid = (filePath: string) => {
  try {
    // 尝试访问文件，如果存在则无异常抛出
    fs.accessSync(filePath, fs.constants.F_OK)
  } catch {
    // 若访问失败，获取父级目录路径，并递归创建缺失的目录结构
    const dirPath = path.dirname(filePath)
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 写入文件内容
 * @param filePath - 目标文件路径
 * @param content - 要写入文件的文本内容
 */
export const writeFile = (filePath: string, content: string) => {
  // 先检查路径有效性，确保文件能被正确写入
  checkPathValid(filePath)
  // 使用同步方式写入文件，编码为 UTF-8
  fs.writeFileSync(filePath, content, 'utf-8')
}

// 定义文件信息接口
export interface FileInfo {
  filePath: string
  dirname: string
  basename: string
  extname: string
  filename: string
  stats?: fs.Stats
}

// 定义FsInstance接口// 定义 FsInstance 接口
interface FsInstance {
  rootPath: string
  folderPath: string
  logPath: string
  filePathList: string[] // 使用项目根目录
  dirPathList: string[]
  userInfo: UserInfo<string>
  eol: string

  // 操作日志记录方法
  saveOperateLog(message: string): void

  // 获取指定路径文件列表方法
  getFilePathList(folderPath: string): void

  //获取文件信息
  getFileInfo(filePath: string): FileInfo

  // 获取文件详细信息列表方法
  getFileInfoList(): FileInfo[]

  // 重命名文件方法
  renameFile(
    oldFilePath: string,
    newFilePath: string
  ): { isChange: boolean; uniqueNewFilePath: string }

  // 复制文件方法
  copyFile(filePath: string): string

  // 删除文件方法
  deleteFile(filePath: string): void
}

// 操作日志打印记录装饰器
function logDecorator() {
  return function (target: FsInstance, name: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value // 保存原始方法引用

    // 增强方法，添加日志记录功能
    descriptor.value = function (...args: unknown[]) {
      const record: LogRecord = {
        methodName: name, // 使用更明确的属性名
        arguments: args,
        timestamp: new Date() // 记录日志的时间戳
      }

      // 执行原始方法之前记录日志
      target.saveOperateLog(JSON.stringify(record))

      try {
        // 执行原始方法
        const result = originalMethod.apply(this, args)
        return result
      } catch (error) {
        // 如果原始方法抛出异常，可以在这里处理（例如记录额外的错误日志）
        throw error // 重新抛出异常，让调用者处理
      }
    }

    return descriptor
  }
}
// 异常处理装饰器与异常日志记录
function catchHandlerDecorator() {
  return function (target: FsInstance, name: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: unknown[]) {
      try {
        // 尝试执行原始方法
        return originalMethod.apply(this, args)
      } catch (error) {
        // 捕获到错误时，创建错误记录
        const record: ErrorRecord = {
          arguments: args,
          error: {
            message: (error as Error).message,
            stack: (error as Error).stack
          },
          methodName: name, // 使用更明确的属性名
          timestamp: new Date() // 记录日志的时间戳
        }

        // 调用 saveOperateLog 方法记录异常信息
        target.saveOperateLog(JSON.stringify(record))

        // 根据业务需求，可以选择重新抛出错误或者返回特定的值
        return null
      }
    }

    return descriptor
  }
}

/**
 * 基于Node.js的文件操作类
 * @author pzc
 * @date 2021/07/12
 */
class fsUtils implements FsInstance {
  folderPath: string
  logPath: string
  filePathList: string[]
  dirPathList: string[]
  userInfo: UserInfo<string>
  eol: string
  constructor(public rootPath: string) {
    this.userInfo = userInfo
    this.eol = eol
    this.folderPath = path.join(rootPath)
    this.logPath = path.join(rootPath, 'fsUtils.log')
    this.filePathList = []
    this.dirPathList = []
    this.dirPathList.push(path.resolve(this.folderPath))
    this.getFilePathList(this.folderPath)
  }

  /**
   * 简易日志记录
   * @param {string} message - 消息记录
   */
  @catchHandlerDecorator()
  saveOperateLog(message: string) {
    // 确保 logPath 是有效的
    if (!this.logPath) {
      console.error('Log path is not defined.')
      return
    }

    // 创建日志记录的基础信息
    const baseInfo = {
      message: message,
      time: new Date().toLocaleString(),
      user: userInfo.username
    }

    // 构建日志内容
    let content = `${JSON.stringify(baseInfo)}${eol}`
    content += `${new Array(100).fill('-').join('-')}${eol}`

    try {
      // 确保日志文件的目录存在
      checkPathValid(path.dirname(this.logPath))

      // 将日志内容追加到日志文件
      fs.appendFileSync(this.logPath, content)
    } catch (err) {
      // 如果写入日志失败，输出错误信息到控制台
      console.error(`Failed to write to log file: ${err}`)
    }
  }

  /**
   * 获取指定路径所有文件列表
   * @param {string} folderPath - 指定路径
   * @returns {Object} 返回文件路径/文件夹路径/文件错误路径列表
   */
  @catchHandlerDecorator()
  getFilePathList(folderPath: string) {
    fs.accessSync(folderPath, fs.constants.F_OK)
    fs.readdirSync(folderPath).forEach((filename: string) => {
      const filePath = path.resolve(folderPath, filename) // 连接路径的两个或多个部分：

      // 判断是否为文件
      if (fs.lstatSync(filePath).isFile()) {
        this.filePathList.push(filePath)
      } else {
        this.dirPathList.push(filePath)
        this.getFilePathList(filePath)
      }
    })
  }

  /**
   * 获取详细信息
   * @param filePath
   * @returns
   */
  getFileInfo(filePath: string): FileInfo {
    const { dir, ext, name, base } = path.parse(filePath)
    try {
      // 尝试获取文件状态信息
      const stats = fs.statSync(filePath)
      return {
        filePath,
        basename: base,
        dirname: dir,
        extname: ext,
        filename: name,
        stats
      }
    } catch (error) {
      // 处理文件不存在或访问权限不足的情况
      console.error(`无法获取文件stats信息: ${error}`)
      return {
        filePath,
        basename: base,
        dirname: dir,
        extname: ext,
        filename: name
      }
    }
  }

  /**
   * 获取文件详细信息列表
   */
  getFileInfoList() {
    const fileInfoList = this.filePathList.map(this.getFileInfo)
    return fileInfoList
  }

  /**
   * 重命名文件名，存在资源抢占问题，需要二次执行rename，或者记录oldFilePath执行fs.rm
   * @param {string} oldFilePath
   * @param {string} newFilePath
   */
  @catchHandlerDecorator()
  @logDecorator()
  renameFile(oldFilePath: string, newFilePath: string) {
    if (oldFilePath === newFilePath) {
      return { isChange: false, uniqueNewFilePath: oldFilePath }
    }

    // 检查新文件路径是否有效
    checkPathValid(newFilePath)

    // 检查新文件名是否已存在
    let uniqueNewFilePath = newFilePath
    let counter = 1
    while (fs.existsSync(uniqueNewFilePath)) {
      // 拆分文件名和扩展名
      const { dir, name, ext } = path.parse(uniqueNewFilePath)
      // 生成新的文件名
      uniqueNewFilePath = path.format({ dir, name: `${name}(${counter})`, ext })
      counter++
    }
    // 重命名文件
    fs.renameSync(oldFilePath, uniqueNewFilePath)
    this.filePathList.splice(this.filePathList.indexOf(oldFilePath), 1, uniqueNewFilePath)

    // 处理空文件夹
    const oldDirPath = path.dirname(oldFilePath)
    const newDirPath = path.dirname(uniqueNewFilePath)
    const result = fs.readdirSync(oldDirPath)
    if (!result.length) {
      fs.rmdirSync(oldDirPath)
    }
    this.dirPathList.splice(this.dirPathList.indexOf(oldDirPath), 1, newDirPath)
    return { isChange: true, uniqueNewFilePath: uniqueNewFilePath }
  }

  /**
   * 复制指定路径原文件
   * @param {string} filePath
   */
  @catchHandlerDecorator()
  @logDecorator()
  copyFile(filePath: string) {
    const dirname = path.dirname(filePath)
    const extensionName = path.extname(filePath) // 文件扩展名

    // 从原始文件名中提取基本名称，并去掉可能存在的"copy"后缀
    const filename = path.basename(filePath, extensionName).split('copy')[0].trim()
    let newBaseName = `${filename} copy${extensionName}`
    let newFilePath = path.resolve(dirname, newBaseName)
    let renameCount = 1 // 文件已存在时的计数器

    // 检查新文件路径是否已存在，并生成一个唯一的新文件名
    while (fs.existsSync(newFilePath)) {
      renameCount++
      newBaseName = `${filename} copy ${renameCount}${extensionName}`
      newFilePath = path.resolve(dirname, newBaseName)
    }

    // 复制文件
    fs.copyFileSync(filePath, newFilePath)

    this.filePathList.push(newFilePath)

    return newFilePath // 返回新文件的路径
  }

  /**
   * 删除指定路径文件
   * @param {string} filePath
   * @returns
   */
  deleteFile(filePath: string) {
    // 检查文件路径是否存在
    if (fs.existsSync(filePath)) {
      // 同步删除文件
      fs.unlinkSync(filePath)
      this.filePathList.splice(this.filePathList.indexOf(filePath), 1)
      console.log(`文件已被删除: ${filePath}`)
    } else {
      console.error(`文件不存在: ${filePath}`)
    }
  }
}

export default fsUtils
