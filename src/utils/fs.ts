import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
const userInfo = os.userInfo() //用户信息
const eol = os.EOL //换行符

interface record {
  name: string
  type: string
  arguments: IArguments
  error?: Error | unknown
}
export interface fileInfo {
  filePath: string
  dirname: string
  basename: string
  extname: string
  filename: string
  stats: fs.Stats
}
interface cache {
  [cacheKey: string]: { index: number }
}
export interface mergeSingelPageOptions {
  sourceFileType: string
  targetFileType: string
  regList: RegExp[]
  backupSource: boolean
  deleteRef: boolean
}

interface customNameFunction {
  (filePath: string): string
}

interface fsInstance {
  rootPath: string
  folderPath: string
  logPath: string
  filePathList: Array<string>
  dirPathList: string[]
  saveOperateLog(message: string): void
  getFilePathList(folderPath: string): void
  getFileInfoList(): fileInfo[]
  modifyFileName(
    customBaseName: string | customNameFunction,
    customExtensionName?: string | customNameFunction,
    filterKeyword?: string,
    filterExtensionName?: string
  ): void
  renameFile(oldFilePath: string, newFilePath: string): boolean
  copyFile(filePath: string): void
}

//操作日志打印记录
function log() {
  return function (
    target: fsInstance,
    name: string,
    descriptor: PropertyDescriptor
  ) {
    const fn = descriptor.value
    descriptor.value = function () {
      const record: record = { name, type: 'log', arguments }
      target.saveOperateLog.call(this, JSON.stringify(record))
      return fn.apply(this, arguments)
    }
    return descriptor
  }
}

//异常处理装饰器与异常日志记录
function catchHandel() {
  return function (
    target: fsInstance,
    name: string,
    descriptor: PropertyDescriptor
  ) {
    const fn = descriptor.value
    descriptor.value = function () {
      try {
        return fn.apply(this, arguments)
      } catch (error) {
        console.error(error)
        const record: record = { name, type: 'catch', arguments, error }
        target.saveOperateLog.call(this, JSON.stringify(record))
        return null
      }
    }
    return descriptor
  }
}

/**
 * //基于node.js的文件操作类,自行执行tsc命令转化为js文件 tsc fs.ts -experimentalDecorators -target ES5
 * @author pzc
 * @date 2021/07/12
 * @example 使用方法e.g.
            let path = require('path')
            let rootPath = path.join('src')
            let fsUtils = require('../assets/js/fs.js')
            let fsInstance = new fsUtils(rootPath)
            fsInstance.xx()
 */
class fsUtils implements fsInstance {
  folderPath: string
  logPath: string
  filePathList: Array<string>
  dirPathList: string[]

  //使用项目根目录
  constructor(public rootPath: string) {
    this.folderPath = path.join(rootPath)
    this.logPath = path.join(rootPath, 'fsUtils.log')
    this.filePathList = [] //指定目录所有文件集合
    this.dirPathList = [] //指定目录所有文件夹集合
    this.getFilePathList(this.folderPath) //直接使用构造器
  }

  /**
   * 简易日志记录
   * @param {string} message //消息记录
   */
  saveOperateLog(message: string) {
    const baseInfo = {
      user: userInfo.username, //操作用户
      time: new Date().toLocaleString(), //操作时间
      message, //操作内容记录
    }
    let content = JSON.stringify(baseInfo) + eol
    const divideLine = new Array(100).fill('-').join('-') + eol //添加分割线
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
      const filePath = path.resolve(folderPath, fileName) //连接路径的两个或多个部分：
      //判断是否为文件
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
        filePath,
        dirname: path.dirname(filePath),
        basename: path.basename(filePath),
        extname: path.extname(filePath),
        filename: path.basename(filePath, path.extname(filePath)),
        stats: fs.statSync(filePath),
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
    customBaseName: string | customNameFunction | null,
    customExtensionName?: string | customNameFunction | null,
    filterKeyword?: string | null,
    filterExtensionName?: string | null
  ) {
    if (!this.filePathList.length) {
      throw new Error('指定路径不存在文件')
    }
    let modifyCount = 0
    let filePathListBackup = [...this.filePathList]
    const cache = <cache>{}
    //添置所有已有文件缓存
    for (const filePath of filePathListBackup) {
      cache[filePath] = { index: 0 }
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
      const dirName = path.dirname(filePath)
      const oldExtensionName = path.extname(filePath) // 文件扩展名
      const oldFileName = path.basename(filePath)
      const oldBaseName = path.basename(filePath, oldExtensionName) //文件名
      let newBaseName, newExtensionName
      //获取新文件名称，不包含后缀名
      if (typeof customBaseName === 'function') {
        newBaseName = customBaseName(filePath)
      } else {
        newBaseName = customBaseName || oldBaseName
      }
      //获取新文件后缀名
      if (typeof customExtensionName === 'function') {
        newExtensionName = customExtensionName(filePath)
      } else {
        newExtensionName = customExtensionName || oldExtensionName
      }
      let newFileName = `${newBaseName}${newExtensionName}`
      //新旧路径重复，跳过本次循环
      if (
        newFileName === oldFileName &&
        newExtensionName === oldExtensionName
      ) {
        return
      }
      let cacheKey = path.join(dirName, newFileName)
      //命名冲突处理，添加计数
      let index = 0
      while (cache[cacheKey]) {
        newFileName = `${newBaseName}(${index++})${newExtensionName}` //重命名
        cacheKey = path.join(dirName, newFileName)
      }
      // 使用rename方法进行重命名
      const oldFilePath = path.resolve(dirName, oldFileName)
      const newFilePath = path.resolve(dirName, newFileName)
      const operateResult = this.renameFile(oldFilePath, newFilePath)
      if (operateResult) {
        modifyCount++
        Reflect.deleteProperty(cache, oldFilePath) //删除旧缓存
        Reflect.set(cache, newFilePath, { index }) //添加新缓存
        // index = 0
      }
    })
    console.log(`批量修改完毕，共${modifyCount}个文件产生变化`)
  }

  /**
   * 重命名文件名，
   * @param {string} oldFilePath
   * @param {string} newFilePath
   */
  @catchHandel()
  @log()
  renameFile(oldFilePath: string, newFilePath: string) {
    fs.renameSync(oldFilePath, newFilePath)
    this.filePathList.push(newFilePath)
    const filePathIndex = this.filePathList.findIndex((i) => i === oldFilePath)
    this.filePathList.splice(filePathIndex, 1)
    return true
  }

  /**
   * 复制指定路径原文件,存在性能瓶颈,有待改进管道流传输
   * @param {string} filePath
   */
  @catchHandel()
  @log()
  copyFile(filePath: string) {
    const dirName = path.dirname(filePath)
    const extensionName = path.extname(filePath) // 文件扩展名
    const baseName = path
      .basename(filePath, extensionName)
      .split('copy')[0]
      .trim()
    let newFileName = `${baseName} copy${extensionName}`
    let newFilePath = path.resolve(dirName, newFileName)
    let renameCount = 1
    //文件已存在
    while (this.filePathList.includes(newFilePath)) {
      renameCount++
      newFileName = `${baseName} copy ${renameCount}${extensionName}`
      newFilePath = path.resolve(dirName, newFileName)
    }
    const fileContent = fs.readFileSync(filePath, 'utf8')
    fs.writeFileSync(newFilePath, fileContent)
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
