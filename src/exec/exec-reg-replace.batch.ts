import fsUtils, { readFile, writeFile } from '../utils/fs'
import { getMainWindow } from '../desktop/main-window'
import { logger } from '../utils/log'

/**
 * 根据提供正则表达式替换内容，直接传入内容，可能链式修改
 * @param reg 正则表达式对象，用于匹配需要替换的内容，必须使用全局匹配模式
 * @param content 需要进行替换操作的原始内容字符串
 * @param matchContentHandle 匹配内容处理函数，接收匹配到的内容字符串，返回替换后的内容字符串
 * @returns 返回包含替换是否发生和替换后内容的对象
 */
export const replaceByReg = (
  reg: RegExp,
  content: string,
  matchContentHandle: (content: string) => string
) => {
  // 参数验证
  if (!(reg instanceof RegExp)) {
    throw new Error('The first argument must be a RegExp object.')
  }
  if (typeof content !== 'string') {
    throw new Error('The second argument must be a string.')
  }
  if (typeof matchContentHandle !== 'function') {
    throw new Error('The third argument must be a function.')
  }

  // 确保正则表达式用于全局搜索
  if (!reg.global) {
    reg = new RegExp(reg.source, reg.flags + 'g')
  }
  let isChange = false // 标识内容是否发生了替换
  let match

  // 使用循环进行替换操作
  while ((match = reg.exec(content))) {
    if (match[0].length === 0) {
      // 避免空匹配导致的无限循环
      reg.lastIndex++
      continue
    }
    const replaceResult = matchContentHandle(match[0])
    if (replaceResult !== match[0]) {
      isChange = true
    }

    // 构建新的字符串
    content = content.slice(0, match.index) + replaceResult + content.slice(reg.lastIndex)
  }
  return {
    isChange,
    content // 返回替换后的内容
  }
}
/**
 * 根据正则表达式批量替换文件内容
 * @param execList 执行列表，包含正则表达式和替换处理函数
 */
export const execReplaceByRegBatch = async (
  dir: string,
  isUseIgnoredFiles: boolean,
  reg: RegExp,
  matchContentHandle: (content: string) => string,
  ignoreFilesPatterns?: Array<RegExp>
) => {
  const fsInstance = new fsUtils(dir, isUseIgnoredFiles)
  let count = 0
  const mainWindow = getMainWindow()
  const changeList: string[] = []
  // 创建一个包含所有替换操作的 Promise 数组
  let promises = fsInstance.filePathList.map(async (filePath) => {
    if (ignoreFilesPatterns && ignoreFilesPatterns.some((pattern) => pattern.test(filePath))) {
    } else {
      let content = await readFile(filePath) // 读取文件内容
      let isChange = false // 标记内容是否发生了替换
      // 遍历执行列表，对文件内容进行多次正则替换
      const result = replaceByReg(reg, content, matchContentHandle)
      // 如果替换结果指示内容发生了变化，则更新内容标记和替换后的内容
      if (result.isChange) {
        isChange = true
        content = result.content
        changeList.push(filePath)
      }
      // 如果内容发生了替换，将替换后的内容写回文件
      if (isChange) {
        await writeFile(filePath, content)
      }
    }
    mainWindow && mainWindow.setProgressBar(count++ / fsInstance.filePathList.length)
  })
  // 等待所有的替换操作完成
  await Promise.all(promises)
  logger.info(`${changeList.length} files changed`)
}
