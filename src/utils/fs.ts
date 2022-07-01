import { checkPathVaild } from '../utils/common'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
const userInfo = os.userInfo() // 用户信息

const eol = os.EOL // 换行符

interface Record {
  name: string
  type: string
  arguments: IArguments
  error?: Error | unknown
}
export interface FileInfo {
  filePath: string
  dirname: string
  basename: string
  extname: string
  filename: string
  stats: fs.Stats
}
interface Cache {
  [cacheKey: string]: {
    index: number
  }
}
interface CustomFilenameFunction {
  (oldFilename: string): string
}
interface CustomExtnameFunction {
  (oldExtname: string): string
}
interface CustomDirnameFunction {
  (oldDirname: string): string
}

interface FsInstance {
  rootPath: string
  folderPath: string
  logPath: string
  filePathList: Array<string>
  dirPathList: string[]
  saveOperateLog(message: string): void
  getFilePathList(folderPath: string): void
  getFileInfoList(): FileInfo[]
  modifyFilename(
    customFilename: string | CustomFilenameFunction | null,
    customExtname?: string | CustomExtnameFunction | null,
    customDirname?: string | CustomDirnameFunction | null,
    filterFilename?: string,
    filterExtensionName?: string
  ): void
  renameFile(oldFilePath: string, newFilePath: string): boolean
  copyFile(filePath: string): void
}
/**
 * 操作日志打印记录
 * @returns
 */

function log() {
  return function (target: FsInstance, name: string, descriptor: PropertyDescriptor) {
    const fn = descriptor.value

    descriptor.value = function () {
      const record: Record = {
        arguments,
        name,
        type: 'log'
      }
      target.saveOperateLog.call(this, JSON.stringify(record))
      return fn.apply(this, arguments)
    }

    return descriptor
  }
}
/**
 * 异常处理装饰器与异常日志记录
 * @returns
 */

function catchHandel() {
  return function (target: FsInstance, name: string, descriptor: PropertyDescriptor) {
    const fn = descriptor.value

    descriptor.value = function () {
      try {
        return fn.apply(this, arguments)
      } catch (error) {
        const record: Record = {
          arguments,
          error,
          name,
          type: 'catch'
        }
        target.saveOperateLog.call(this, JSON.stringify(record))
        return null
      }
    }

    return descriptor
  }
}
/**
 * //基于node.js的文件操作类
 * @author pzc
 * @date 2021/07/12
 */

class fsUtils implements FsInstance {
  folderPath: string
  logPath: string
  filePathList: Array<string>
  dirPathList: string[] // 使用项目根目录

  constructor(public rootPath: string) {
    this.folderPath = path.join(rootPath)
    this.logPath = path.join(rootPath, 'fsUtils.log')
    this.filePathList = [] // 指定目录所有文件集合

    this.dirPathList = [] // 指定目录所有文件夹集合

    this.getFilePathList(this.folderPath) // 直接使用构造器
  }
  /**
   * 简易日志记录
   * @param {string} message //消息记录
   */

  saveOperateLog(message: string) {
    const baseInfo = {
      // 操作内容记录
      message,
      // 操作时间
      time: new Date().toLocaleString(),
      // 操作用户
      user: userInfo.username
    }
    let content = JSON.stringify(baseInfo) + eol
    const divideLine = new Array(100).fill('-').join('-') + eol // 添加分割线

    content += divideLine

    try {
      fs.appendFileSync(this.logPath, content)
    } catch (err) {}
  }
  /**
   * 获取指定路径所有文件列表
   * @param {string} folderPath //指定路径
   * @returns {Object} 返回文件路径/文件夹路径/文件错误路径列表
   */

  @catchHandel()
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
   * @param {string|funcion} customFilename 新文件名不包含后缀,为空则使用旧文件名
   * @param {string|funcion} customExtname //新后缀名，为空则使用旧后缀名
   * @param {string} filterFilename 限定过滤关键字
   * @param {string} filterExtensionName 限定过滤后缀名
   * @example // 自定义新文件名规则（不包含后缀名）
              const customBasenameGenerateFunction = (oldFilename) => {
                return oldFilename
              }
              fsInstance.modifyFilename(customBasenameGenerateFunction)
   */
  @log()
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

    let modifyCount = 0
    let filePathListBackup = [...this.filePathList]
    const cache: Cache = {} // 添置所有已有文件缓存

    for (const filePath of filePathListBackup) {
      cache[filePath] = {
        index: 0
      }
    }

    if (filterFilename) {
      filePathListBackup = this.filePathList.filter(
        (filePath) => path.basename(filePath, path.extname(filePath)).indexOf(filterFilename) > -1
      )
    }

    if (filterExtensionName) {
      filePathListBackup = this.filePathList.filter(
        (filePath) => path.extname(filePath).indexOf(filterExtensionName) > -1
      )
    }

    filePathListBackup.forEach((filePath) => {
      const oldDirname = path.dirname(filePath)
      const oldExtname = path.extname(filePath) // 文件扩展名
      const oldBaseName = path.basename(filePath)
      const oldFilename = path.basename(filePath, oldExtname) // 文件名

      let newFilename // 获取新文件名称，不包含后缀名

      let newExtensionName
      let newDirname

      if (typeof customFilename === 'function') {
        newFilename = customFilename(oldFilename) || oldFilename
      } else {
        newFilename = customFilename || oldFilename
      } // 获取新文件后缀名

      if (typeof customExtname === 'function') {
        newExtensionName = customExtname(oldExtname) || oldExtname
      } else {
        newExtensionName = customExtname || oldExtname
      }

      let newBaseName = `${newFilename}${newExtensionName}` // 新旧路径重复，跳过本次循环

      if (typeof customDirname === 'function') {
        newDirname = customDirname(oldDirname) || oldDirname
      } else {
        newDirname = customDirname || oldDirname
      }

      if (newBaseName === oldBaseName && newDirname === oldDirname) {
        return
      }

      let cacheKey = path.join(newDirname, newBaseName) // 命名冲突处理，添加计数

      let index = 0

      while (cache[cacheKey]) {
        newBaseName = `${newFilename}(${index++})${newExtensionName}` // 重命名

        cacheKey = path.join(newDirname, newBaseName)
      } // 使用rename方法进行重命名

      const oldFilePath = path.resolve(oldDirname, oldBaseName)
      const newFilePath = path.resolve(newDirname, newBaseName)
      const operateResult = this.renameFile(oldFilePath, newFilePath)

      if (operateResult) {
        Reflect.deleteProperty(cache, oldFilePath) // 删除旧缓存

        Reflect.set(cache, newFilePath, {
          index
        })
        modifyCount++
      }
    })
    console.log(`批量修改完毕，共${modifyCount}个文件产生变化`)
  }
  /**
   * 重命名文件名，存在资源抢占问题，需要二次执行rename，或者记录oldFilePath执行fs.rm
   * @param {string} oldFilePath
   * @param {string} newFilePath
   */

  @catchHandel()
  @log()
  renameFile(oldFilePath: string, newFilePath: string) {
    if (oldFilePath === newFilePath) {
      return false
    }

    checkPathVaild(newFilePath)
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

  @catchHandel()
  @log()
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

  @catchHandel()
  @log()
  deleteFile(filePath: string) {
    fs.unlinkSync(filePath)
    const filePathIndex = this.filePathList.findIndex((i) => i === filePath)
    this.filePathList.splice(filePathIndex, 1)
  }
}

export default fsUtils
