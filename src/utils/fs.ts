import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { checkPathVaild } from '../utils/common'
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
interface CustomNameFunction {
  (filePath: string): string
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
  modifyFileName(
    customBaseName: string | CustomNameFunction,
    customExtensionName?: string | CustomNameFunction,
    filterKeyword?: string,
    filterExtensionName?: string,
    customDirName?: string | CustomNameFunction
  ): void
  renameFile(oldFilePath: string, newFilePath: string): boolean
  copyFile(filePath: string): void
} // 操作日志打印记录

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
} // 异常处理装饰器与异常日志记录

function catchHandel() {
  return function (target: FsInstance, name: string, descriptor: PropertyDescriptor) {
    const fn = descriptor.value

    descriptor.value = function () {
      try {
        return fn.apply(this, arguments)
      } catch (error) {
        console.error(error)
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
 * //基于node.js的文件操作类,自行执行tsc命令转化为js文件使用
 * @author pzc
 * @date 2021/07/12
 * @example 使用方法e.g.
            let path = require('path')
            let rootPath = path.join('src')
            let fsUtils = require('../assets/js/fs.js')
            let fsInstance = new fsUtils(rootPath)
            fsInstance.xx()
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
    } catch (err) {
      console.error(err)
    }
  }
  /**
   * 获取指定路径所有文件列表
   * @param {string} folderPath //指定路径
   * @returns {Object} 返回文件路径/文件夹路径/文件错误路径列表
   */

  @catchHandel()
  getFilePathList(folderPath: string) {
    fs.accessSync(folderPath, fs.constants.F_OK)
    fs.readdirSync(folderPath).forEach((fileName: string) => {
      const filePath = path.resolve(folderPath, fileName) // 连接路径的两个或多个部分：
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
  // @catchHandel()

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
   * @param {string|funcion} customBaseName 新文件名不包含后缀,为空则使用旧文件名
   * @param {string|funcion} customExtensionName //新后缀名，为空则使用旧后缀名
   * @param {string} filterKeyword 限定过滤关键字
   * @param {string} filterExtensionName 限定过滤后缀名
   * @example // 自定义新文件名规则（不包含后缀名）
              const customBaseNameGenerateFunction = (oldFile) => {
                let source = require('./source.js')
                let oldExtensionName = path.extname(oldFile) // 文件扩展名
                let oldBaseName = path.basename(oldFile, oldExtensionName) //文件名
                source.commonList.find((item) => item.fileName.split(oldExtensionName)[0] === oldBaseName)
                  ?.target || oldBaseName
              }
              // 自定义新文件名规则（不包含后缀名）
              const customBaseNameReplaceFunction = (oldFile) => {
                let oldExtensionName = path.extname(oldFile)
                let oldBaseName = path.basename(oldFile, oldExtensionName)
                return oldBaseName.replace(/xx/g, 'pzc')
              }
              fsInstance.modifyFileName(customBaseNameGenerateFunction, null, null, '.png') //批量处理
              fsInstance.modifyFileName(null, '.test', null, '.txt') //批量处理
   */

  modifyFileName(
    customBaseName: string | CustomNameFunction | null,
    customExtensionName?: string | CustomNameFunction | null,
    filterKeyword?: string | null,
    filterExtensionName?: string | null,
    customDirName?: string | CustomNameFunction | null
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

    if (filterKeyword) {
      filePathListBackup = this.filePathList.filter(
        (filePath) => path.basename(filePath).indexOf(filterKeyword) > -1
      )
    }

    if (filterExtensionName) {
      filePathListBackup = this.filePathList.filter(
        (filePath) => path.extname(filePath).indexOf(filterExtensionName) > -1
      )
    }

    filePathListBackup.forEach((filePath) => {
      const oldDirName = path.dirname(filePath)
      const oldExtensionName = path.extname(filePath) // 文件扩展名

      const oldFileName = path.basename(filePath)
      const oldBaseName = path.basename(filePath, oldExtensionName) // 文件名

      let newBaseName // 获取新文件名称，不包含后缀名

      let newExtensionName

      let newDirName

      if (typeof customBaseName === 'function') {
        newBaseName = customBaseName(filePath)
      } else {
        newBaseName = customBaseName || oldBaseName
      } // 获取新文件后缀名

      if (typeof customExtensionName === 'function') {
        newExtensionName = customExtensionName(filePath)
      } else {
        newExtensionName = customExtensionName || oldExtensionName
      }

      let newFileName = `${newBaseName}${newExtensionName}` // 新旧路径重复，跳过本次循环

      if (typeof customDirName === 'function') {
        newDirName = customDirName(filePath)
      } else {
        newDirName = customDirName || oldDirName
      }

      if (
        newFileName.toLocaleLowerCase() === oldFileName.toLocaleLowerCase() &&
        newExtensionName.toLocaleLowerCase() === oldExtensionName.toLocaleLowerCase() &&
        newDirName.toLocaleLowerCase() === oldDirName.toLocaleLowerCase()
      ) {
        return
      }

      let cacheKey = path.join(newDirName, newFileName) // 命名冲突处理，添加计数

      let index = 0

      while (cache[cacheKey]) {
        newFileName = `${newBaseName}(${index++})${newExtensionName}` // 重命名

        cacheKey = path.join(newDirName, newFileName)
      } // 使用rename方法进行重命名

      const oldFilePath = path.resolve(oldDirName, oldFileName)
      const newFilePath = path.resolve(newDirName, newFileName)
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
    const dirName = path.dirname(filePath)
    const extensionName = path.extname(filePath) // 文件扩展名

    const baseName = path.basename(filePath, extensionName).split('copy')[0].trim()
    let newFileName = `${baseName} copy${extensionName}`
    let newFilePath = path.resolve(dirName, newFileName)
    let renameCount = 1 // 文件已存在

    while (this.filePathList.includes(newFilePath)) {
      renameCount++
      newFileName = `${baseName} copy ${renameCount}${extensionName}`
      newFilePath = path.resolve(dirName, newFileName)
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
