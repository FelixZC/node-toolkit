import { app } from 'electron'
import { classifyFileMimeType, formatFileSize } from './common'
import { formatInputDateTime } from '../utils/time'
/**`
 * fs.ts使用读异步，写同步
 * TODO 添加缓存功能操作
 */
import * as fs from 'fs-extra'
import { logDecorator, logger } from '../utils/log'
import { LRUCache } from 'lru-cache'
import * as os from 'os'
import * as path from 'path'
import { useIgnored } from '../utils/ignore'
import type { FileInfo, FileInfoWithStats } from '@src/types/file'
const fileContentCache = new LRUCache<string, string>({
  max: 1000,
  ttl: 30 * 60 * 1000 // 10 minutes
})
const fileStatsCache = new LRUCache<string, fs.Stats>({
  max: 100000,
  ttl: 30 * 60 * 1000 // 30 minutes
})

// 创建一个 LRU 缓存实例
const iconCache = new LRUCache<string, string>({
  max: 100000,
  ttl: 30 * 60 * 1000 // 30 minutes
})

export const clearCacheAll = () => {
  fileContentCache.clear() // 清除所有缓存项
  fileStatsCache.clear() // 清除所有缓存项
  iconCache.clear()
}
export const writeFile = async (filePath: string, content: string) => {
  // 先更新缓存
  fileContentCache.set(filePath, content)
  // 然后写入文件系统
  await fs.outputFile(filePath, content, 'utf-8')
}
export const readFile = async (filePath: string): Promise<string> => {
  // 检查缓存中是否存在内容
  const cachedContent = fileContentCache.get(filePath)
  if (cachedContent) {
    return Promise.resolve(cachedContent)
  }
  // 如果缓存中没有，读取文件并更新缓存
  const data = await fs.readFile(filePath, 'utf-8')
  fileContentCache.set(filePath, data)
  return data
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

async function getCachedFileIcon(filePath: string): Promise<string> {
  if (iconCache.has(filePath)) {
    return iconCache.get(filePath) as string
  }
  const icon = await app.getFileIcon(filePath, { size: 'large' })
  const iconDataUrl = icon.toDataURL({
    scaleFactor: 1
  })
  iconCache.set(filePath, iconDataUrl)
  return iconDataUrl
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
  const fileIcon = await getCachedFileIcon(filePath)
  const parsedPath = path.parse(filePath)
  return {
    filePath,
    ...parsedPath,
    ...stats,
    type: stats.isDirectory() ? 'Folder' : classifyFileMimeType(parsedPath.ext),
    // 文件类型
    fileIcon,
    sizeFormat: stats.isDirectory() ? '' : formatFileSize(stats.size),
    atimeFormat: formatInputDateTime(stats.atime),
    mtimeFormat: formatInputDateTime(stats.mtime),
    ctimeFormat: formatInputDateTime(stats.ctime),
    birthtimeFormat: formatInputDateTime(stats.birthtime)
  }
}
function generateUniquePath(filePath: string): string {
  let uniquePath = filePath
  while (fs.existsSync(uniquePath)) {
    const { dir, name, ext } = path.parse(uniquePath)
    const pre = name.split('(')[0] // Handle file names with counters like 'example(1)'
    const counter = parseInt(name.match(/\((\d+)\)/)?.[1] || '0')
    uniquePath = path.format({
      dir,
      name: `${pre}(${counter + 1})`,
      ext
    })
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
    uniquePath = path.format({
      dir,
      name: `${pre}(${counter + 1})`,
      ext
    })
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
    logger.error(`Error copying file ${filePath}:`, err)
    throw err
  }
}
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath)
    fileContentCache.delete(filePath)
    fileStatsCache.delete(filePath)
    iconCache.delete(filePath)
  } catch (err) {
    logger.error(`Error deleting file ${filePath}:`, err)
    throw err
  }
}
export function renameFile(
  oldFilePath: string,
  newFilePath: string
): {
  isChange: boolean
  uniqueNewFilePath: string
} {
  if (oldFilePath === newFilePath) {
    return {
      isChange: false,
      uniqueNewFilePath: oldFilePath
    }
  }
  const uniqueNewFilePath = generateUniquePath(newFilePath)
  try {
    fs.renameSync(oldFilePath, uniqueNewFilePath)
    fileContentCache.set(uniqueNewFilePath, fileContentCache.get(oldFilePath))
    return {
      isChange: true,
      uniqueNewFilePath
    }
  } catch (err) {
    logger.error(`Error renaming file from ${oldFilePath} to ${uniqueNewFilePath}:`, err)
    throw err
  }
}
/******************************************************************************************************************** */

/******************************************************************************************************************** */
class fsUtils {
  rootPath: string
  eol: string
  filePathList: string[] = []
  dirPathList: string[] = []
  constructor(
    public inputRootPath: string,
    isUseIgnore?: boolean
  ) {
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
      const dirents = fs.readdirSync(dir, {
        withFileTypes: true
      })
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
      const dirents = fs.readdirSync(dir, {
        withFileTypes: true
      })
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
  getDirectoryList(): FileInfo[] {
    return this.dirPathList.map((dirPath) => getFileInfo(dirPath))
  }
  async getDirectoryListWithStats(): Promise<FileInfo[]> {
    return Promise.all(this.dirPathList.map((dirPath) => getFileInfoWithStats(dirPath)))
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
    return {
      isChange,
      uniqueNewFilePath
    }
  }
  @logDecorator
  async copyFile(oldFilePath: string) {
    const newFilePath = await copyFile(oldFilePath)
    this.updateFileListsAfterChange(undefined, newFilePath)
    return newFilePath
  }
}
export default fsUtils
