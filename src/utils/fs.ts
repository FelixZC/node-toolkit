import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

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
  stats: fs.Stats
}

// 定义缓存接口
interface Cache {
  [cacheKey: string]: {
    index: number
  }
}

// 定义自定义文件名、扩展名、目录名函数接口
interface CustomFilenameFunction {
  (oldFilename: string): string
}
interface CustomExtnameFunction {
  (oldExtname: string): string
}
interface CustomDirnameFunction {
  (oldDirname: string): string
}

// 修改文件名的结果类型
interface ModifyResult {
  oldName: string
  newName: string
}

// modifyFilename 方法的返回类型
type ModifyFilenameReturnType = {
  modifyCount: number
  changeRecords: ModifyResult[]
}

// 定义FsInstance接口// 定义 FsInstance 接口
interface FsInstance {
  rootPath: string
  folderPath: string
  logPath: string
  filePathList: string[] // 使用项目根目录
  dirPathList: string[]

  // 操作日志记录方法
  saveOperateLog(message: string): void

  // 获取指定路径文件列表方法
  getFilePathList(folderPath: string): void

  // 获取文件详细信息列表方法
  getFileInfoList(): FileInfo[]

  // 修改文件名方法
  modifyFilename(
    customFilename: string | CustomFilenameFunction | null,
    customExtname?: string | CustomExtnameFunction | null,
    customDirname?: string | CustomDirnameFunction | null,
    filterFilename?: string,
    filterExtensionName?: string
  ): ModifyFilenameReturnType

  // 重命名文件方法
  renameFile(oldFilePath: string, newFilePath: string): boolean

  // 复制文件方法
  copyFile(filePath: string): void

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

  constructor(public rootPath: string) {
    this.folderPath = path.join(rootPath)
    this.logPath = path.join(rootPath, 'fsUtils.log')
    this.filePathList = []
    this.dirPathList = []
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
   * 获取文件详细信息列表
   */
  getFileInfoList() {
    const fileInfoList = this.filePathList.map((filePath) => {
      return {
        basename: path.basename(filePath),
        dirname: path.dirname(filePath),
        extname: path.extname(filePath),
        filename: path.basename(filePath, path.extname(filePath)),
        filePath,
        stats: fs.statSync(filePath)
      }
    })
    return fileInfoList
  }

  /**
   * 修改文件名
   * @param {string|funcion} customFilename - 新文件名不包含后缀,为空则使用旧文件名
   * @param {string|funcion} customExtname - 新后缀名，为空则使用旧后缀名
   * @param {string} filterFilename - 限定过滤关键字
   * @param {string} filterExtensionName - 限定过滤后缀名
   * @example // 自定义新文件名规则（不包含后缀名）
              const customBasenameGenerateFunction = (oldFilename) => {
                return oldFilename;
              }
              fsInstance.modifyFilename(customBasenameGenerateFunction);
   */
  @catchHandlerDecorator()
  @logDecorator()
  modifyFilename(
    customFilename: string | CustomFilenameFunction | null,
    customExtname?: string | CustomExtnameFunction | null,
    customDirname?: string | CustomDirnameFunction | null,
    filterFilename?: string | null,
    filterExtensionName?: string | null
  ) {
    if (!this.filePathList.length) {
      throw new Error('指定路径不存在文件')
    }
    const changeRecords: { oldName: string; newName: string }[] = [] // 变更
    let modifyCount = 0
    let filePathListBackup = [...this.filePathList]
    const cache: Cache = {} // 添置所有已有文件缓存

    for (const filePath of filePathListBackup) {
      cache[filePath] = {
        index: 0
      }
    }

    // 应用文件名和扩展名过滤器
    const filteredFiles = filePathListBackup.filter((filePath) => {
      const baseName = path.basename(filePath, path.extname(filePath))
      const extName = path.extname(filePath)
      return (
        (!filterFilename || baseName.includes(filterFilename)) &&
        (!filterExtensionName || extName.includes(filterExtensionName))
      )
    })

    // 批量修改文件名
    filteredFiles.forEach((filePath) => {
      const oldDirname = path.dirname(filePath)
      const oldExtname = path.extname(filePath)
      // const oldBaseName = path.basename(filePath)
      const oldFilename = path.basename(filePath, oldExtname)

      let newFilename =
        typeof customFilename === 'function' ? customFilename(oldFilename) : customFilename
      let newExtensionName =
        typeof customExtname === 'function' ? customExtname(oldExtname) : customExtname
      let newDirname =
        typeof customDirname === 'function' ? customDirname(oldDirname) : customDirname

      newFilename = newFilename || oldFilename
      newExtensionName = newExtensionName || oldExtname
      newDirname = newDirname || oldDirname

      const newBaseName = `${newFilename}${newExtensionName}`
      const newFilePath = path.resolve(newDirname, newBaseName)

      if (filePath === newFilePath) {
        return // 如果新旧文件路径相同，跳过
      }

      // 检查并解决命名冲突
      let cacheKey = newFilePath
      if (cache[cacheKey]) {
        let index = cache[cacheKey].index
        do {
          const numberedBaseName = `${newFilename}(${++index})${newExtensionName}`
          cacheKey = path.resolve(newDirname, numberedBaseName)
        } while (cache[cacheKey])
      }

      // 重命名文件
      const operateResult = this.renameFile(filePath, cacheKey)
      if (operateResult) {
        // 更新变更记录数组
        changeRecords.push({
          oldName: filePath,
          newName: cacheKey
        })
        cache[cacheKey] = { index: 0 } // 更新缓存
        modifyCount++
      }
    })

    console.log(`批量修改完毕，共${modifyCount}个文件产生变化`)
    return { modifyCount, changeRecords }
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
      return false
    }

    checkPathValid(newFilePath)
    fs.renameSync(oldFilePath, newFilePath)
    this.filePathList.push(newFilePath)
    const filePathIndex = this.filePathList.findIndex((i) => i === oldFilePath)
    this.filePathList.splice(filePathIndex, 1)
    return true
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

    const filename = path.basename(filePath, extensionName).split('copy')[0].trim()
    let newBaseName = `${filename} copy${extensionName}`
    let newFilePath = path.resolve(dirname, newBaseName)
    let renameCount = 1 // 文件已存在

    while (this.filePathList.includes(newFilePath)) {
      renameCount++
      newBaseName = `${filename} copy ${renameCount}${extensionName}`
      newFilePath = path.resolve(dirname, newBaseName)
    }

    fs.copyFileSync(filePath, newFilePath)
    this.filePathList.push(newFilePath)
  }

  /**
   * 删除指定路径文件
   * @param {string} filePath
   * @returns
   */
  @catchHandlerDecorator()
  @logDecorator()
  deleteFile(filePath: string) {
    fs.unlinkSync(filePath)
    const filePathIndex = this.filePathList.findIndex((i) => i === filePath)
    this.filePathList.splice(filePathIndex, 1)
  }
}
export default fsUtils
