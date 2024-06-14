import * as fs from 'fs-extra'
import { ParsedPath } from 'path'
import * as os from 'os'
import * as path from 'path'
import { app } from 'electron'
import { LRUCache } from 'lru-cache'
import { logDecorator } from '../utils/log'
import { FileType, classifyFileTypeByExt } from './common'
import ignore from 'ignore' // 导入默认导出的 ignore 函数
/**
 * fs.ts使用读异步，写同步
 * TODO 添加缓存功能操作
 */

export interface FileInfo extends ParsedPath {
  filePath: string
}

export interface FileInfoWithStats extends ParsedPath, fs.Stats {
  filePath: string
  type: FileType
}

// 创建LRU缓存实例，最大容量为1000个缓存项，缓存项在10分钟后过期
const fileContentCache = new LRUCache<string, string>({
  max: 1000,
  ttl: 10 * 60 * 1000 // 10 minutes
})

const fileStatsCache = new LRUCache<string, fs.Stats>({
  max: 1000,
  ttl: 10 * 60 * 1000 // 10 minutes
})

// 清除所有缓存
export const clearCacheAll = () => {
  fileContentCache.clear() // 清除所有缓存项
  fileStatsCache.clear() // 清除所有缓存项
}

// writeFile 函数添加缓存逻辑
export const writeFile = async (filePath: string, content: string) => {
  // 先更新缓存
  fileContentCache.set(filePath, content)
  // 然后写入文件系统
  await fs.outputFile(filePath, content, 'utf-8')
}

export const readFile = (filePath: string): Promise<string> => {
  // 检查缓存中是否存在内容
  const cachedContent = fileContentCache.get(filePath)
  if (cachedContent) {
    return Promise.resolve(cachedContent)
  }
  // 如果缓存中没有，读取文件并更新缓存
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        fileContentCache.set(filePath, data)
        resolve(data)
      }
    })
  })
}
export const readFileStats = async (filePath: string): Promise<fs.Stats> => {
  const cachedStats = fileStatsCache.get(filePath)
  if (cachedStats !== undefined) {
    return cachedStats
  } else {
    const stats = await fs.stat(filePath)
    fileStatsCache.set(filePath, stats)
    return stats
  }
}

export function getFileInfo(filePath: string): FileInfo {
  const parsedPath = path.parse(filePath)
  return {
    filePath: filePath,
    ...parsedPath
  }
}

export async function getFileInfoWithStats(filePath: string): Promise<FileInfoWithStats> {
  const stats = await readFileStats(filePath)
  const parsedPath = path.parse(filePath)
  return {
    filePath,
    ...parsedPath,
    ...stats,
    type: stats.isDirectory() ? 'Folder' : classifyFileTypeByExt(parsedPath.ext) // 文件类型
  }
}

function generateUniquePath(filePath: string): string {
  let uniquePath = filePath
  while (fs.existsSync(uniquePath)) {
    const { dir, name, ext } = path.parse(uniquePath)
    const pre = name.split('(')[0] // Handle file names with counters like 'example(1)'
    const counter = parseInt(name.match(/\((\d+)\)/)?.[1] || '0')
    uniquePath = path.format({ dir, name: `${pre}(${counter + 1})`, ext })
  }
  return uniquePath
}

export function generateUniquePathWithoutFs(filePath: string, oldFilePathSet: Set<string>): string {
  let uniquePath = filePath
  while (oldFilePathSet.has(uniquePath)) {
    const { dir, name, ext } = path.parse(uniquePath)
    const pre = name.split('(')[0]
    const matchResult = name.match(/\((\d+)\)/)
    const counter = parseInt(matchResult ? matchResult[1] : '0', 10)
    uniquePath = path.format({ dir, name: `${pre}(${counter + 1})`, ext })
  }

  return uniquePath
}

function generateUniquePathForCopy(filePath: string): string {
  const { dir, name, ext } = path.parse(filePath)
  let newBaseName = `${name} copy${ext}`
  let newFilePath = path.resolve(dir, newBaseName)
  let renameCount = 1

  while (fs.existsSync(newFilePath)) {
    newBaseName = `${name} copy ${renameCount}${ext}`
    newFilePath = path.resolve(dir, newBaseName)
    renameCount++
  }

  return newFilePath
}

export async function copyFile(filePath: string): Promise<string> {
  const newFilePath = generateUniquePathForCopy(filePath)
  try {
    fs.copySync(filePath, newFilePath)
    fileContentCache.set(newFilePath, await readFile(filePath))
    return newFilePath
  } catch (err) {
    console.error(`Error copying file ${filePath}:`, err)
    throw err
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath)
    fileContentCache.delete(filePath)
    fileStatsCache.delete(filePath)
  } catch (err) {
    console.error(`Error deleting file ${filePath}:`, err)
    throw err
  }
}

export function renameFile(
  oldFilePath: string,
  newFilePath: string
): { isChange: boolean; uniqueNewFilePath: string } {
  if (oldFilePath === newFilePath) {
    return { isChange: false, uniqueNewFilePath: oldFilePath }
  }
  const uniqueNewFilePath = generateUniquePath(newFilePath)
  try {
    fs.renameSync(oldFilePath, uniqueNewFilePath)
    fileContentCache.set(uniqueNewFilePath, fileContentCache.get(oldFilePath))
    return { isChange: true, uniqueNewFilePath }
  } catch (err) {
    console.error(`Error renaming file from ${oldFilePath} to ${uniqueNewFilePath}:`, err)
    throw err
  }
}
/******************************************************************************************************************** */
export function getIgnorePath(): string {
  const basePath = process.env.NODE_ENV === 'production' ? app.getPath('appData') : process.cwd()
  return path.join(basePath, '.gitignore')
}
class GitIgnoreParser {
  private ignoreRules: ReturnType<typeof ignore>

  constructor() {
    this.ignoreRules = ignore()
  }
  loadFromFile() {
    const gitIgnorePath = getIgnorePath()
    if (fs.existsSync(gitIgnorePath)) {
      const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf-8')
      this.ignoreRules.add(gitIgnoreContent)
    } else {
      fs.ensureFileSync(gitIgnorePath)
    }
  }

  test(filePath: string): boolean {
    // 传入的 filePath 应该是相对于项目根目录的相对路径
    return this.ignoreRules.ignores(filePath)
  }
}

export function useIgnored(): { ignore: (filePath: string) => boolean } {
  const parser = new GitIgnoreParser()
  parser.loadFromFile()

  return {
    ignore: (filePath: string) => parser.test(filePath)
  }
}
/******************************************************************************************************************** */
// FsInstance接口
export interface FsInstance {
  rootPath: string
  filePathList: string[]
  dirPathList: string[]
  eol: string
  getFileInfoList(): FileInfo[]
  getFileInfoListWithStats(): Promise<FileInfo[]>
  addFile(filePath: string, content: string): Promise<void>
  deleteFile(filePath: string): Promise<void>
  renameFile(
    oldFilePath: string,
    newFilePath: string
  ): { isChange: boolean; uniqueNewFilePath: string }
}

// 文件夹操作类
class fsUtils implements FsInstance {
  rootPath: string
  filePathList: string[] = []
  dirPathList: string[] = []
  eol: string
  constructor(public inputRootPath: string, isUseIgnore?: boolean) {
    this.eol = os.EOL
    this.rootPath = path.resolve(inputRootPath)
    if (isUseIgnore) {
      this.refreshFileListsUseIgnore()
    } else {
      this.refreshFileLists()
    }
  }
  // 刷新文件列表和目录列表
  private refreshFileLists() {
    this.filePathList = []
    this.dirPathList = [this.rootPath]
    const walk = async (dir: string): Promise<void> => {
      const dirents = fs.readdirSync(dir, { withFileTypes: true })
      for (const dirent of dirents) {
        const newDir = path.resolve(dir, dirent.name)
        if (dirent.isDirectory()) {
          this.dirPathList.push(newDir)
          walk(newDir)
        } else {
          this.filePathList.push(newDir)
        }
      }
    }

    walk(this.rootPath)
  }

  // 刷新文件列表和目录列表，使用忽略文件.gitignore
  private refreshFileListsUseIgnore() {
    this.filePathList = []
    this.dirPathList = [this.rootPath]
    const { ignore } = useIgnored()
    const walk = (dir: string): void => {
      const dirents = fs.readdirSync(dir, { withFileTypes: true })
      for (const dirent of dirents) {
        const newDir = path.resolve(dir, dirent.name)
        const relativePath = path.relative(this.rootPath, newDir)
        // 检查是否应该忽略该文件或目录
        if (ignore(relativePath)) {
          continue
        }
        if (dirent.isDirectory()) {
          this.dirPathList.push(newDir)
          walk(newDir)
        } else {
          this.filePathList.push(newDir)
        }
      }
    }
    walk(this.rootPath)
  }
  getFileInfoList(): FileInfo[] {
    return this.filePathList.map((filePath) => getFileInfo(filePath))
  }
  async getFileInfoListWithStats(): Promise<FileInfo[]> {
    return Promise.all(this.filePathList.map((filePath) => getFileInfoWithStats(filePath)))
  }

  // 更新文件列表和目录列表
  private updateFileListsAfterChange(oldPath?: string, newPath?: string): void {
    // 移除旧路径
    if (oldPath) {
      this.filePathList.splice(this.filePathList.indexOf(oldPath), 1)
    }
    // 添加新路径
    if (newPath) {
      this.filePathList.push(newPath)
    }
  }

  // 新增文件操作
  @logDecorator
  async addFile(filePath: string, content: string): Promise<void> {
    const newFilePath = path.resolve(this.rootPath, filePath)
    await writeFile(newFilePath, content)
    this.updateFileListsAfterChange(undefined, newFilePath)
  }

  // 删除文件操作
  @logDecorator
  async deleteFile(filePath: string): Promise<void> {
    const oldFilePath = path.resolve(this.rootPath, filePath)
    await deleteFile(oldFilePath)
    this.updateFileListsAfterChange(oldFilePath)
  }

  // 重命名文件操作
  @logDecorator
  renameFile(oldFilePath: string, newFilePath: string) {
    const { isChange, uniqueNewFilePath } = renameFile(oldFilePath, newFilePath)
    if (isChange) {
      this.updateFileListsAfterChange(oldFilePath, uniqueNewFilePath)
    }
    return { isChange, uniqueNewFilePath }
  }

  @logDecorator
  async copyFile(oldFilePath: string) {
    const newFilePath = await copyFile(oldFilePath)
    this.updateFileListsAfterChange(undefined, newFilePath)
    return newFilePath
  }
}

export default fsUtils
