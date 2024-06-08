import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { logDecorator } from '../utils/log'
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
  filePathList: string[] // 使用项目根目录
  dirPathList: string[]
  eol: string

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

/**
 * 基于Node.js的文件操作类
 * @author pzc
 * @date 2021/07/12
 */
class fsUtils implements FsInstance {
  folderPath: string
  filePathList: string[]
  dirPathList: string[]
  eol: string
  constructor(public rootPath: string) {
    this.eol = os.EOL
    this.folderPath = path.join(rootPath)
    this.filePathList = []
    this.dirPathList = []
    this.dirPathList.push(path.resolve(this.folderPath))
    this.getFilePathList(this.folderPath)
  }

  /**
   * 获取指定路径所有文件列表
   * @param {string} folderPath - 指定路径
   * @returns {Object} 返回文件路径/文件夹路径/文件错误路径列表
   */
  getFilePathList(folderPath: string) {
    try {
      fs.accessSync(folderPath, fs.constants.F_OK)
      fs.readdirSync(folderPath).forEach((basename) => {
        const filePath = path.resolve(folderPath, basename)
        try {
          if (fs.lstatSync(filePath).isFile()) {
            this.filePathList.push(filePath)
          } else {
            if (!this.dirPathList.includes(filePath)) {
              // 避免重复添加目录
              this.dirPathList.push(filePath)
              this.getFilePathList(filePath) // 递归调用
            }
          }
        } catch (error) {
          console.error(`Error accessing file or directory: ${filePath}`, error)
        }
      })
    } catch (error) {
      console.error(`Error accessing folder: ${folderPath}`, error)
    }
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
  @logDecorator()
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
