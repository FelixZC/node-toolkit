import { writeFile } from '../utils/fs'
import { Exec } from './index'
import path from 'path'

/**
 * 执行指定目录下的批量正则查询并返回结果
 * @param {string} dir - 要查询的目录路径
 * @param {RegExp} reg - 要应用的正则表达式
 * @returns {string} - 查询结果
 */
export function batchRegQueryAndReturnResult(
  dir: string,
  reg: RegExp,
  ignoreFilesPatterns?: Array<RegExp>,
  isAddSourcePath?: boolean
) {
  const exec = new Exec(dir)
  const result = exec.batchRegQuery(reg, ignoreFilesPatterns, isAddSourcePath)
  return result
}

const dirPath = path.join('src copy') // 指定要查询的目录
// const regexPattern = /(\w+)?(Date|Term)\b/gi; // 指定要使用的正则表达式
const regexPattern = /执行.*/gi
const ignoreFilesPatterns = [
  /node_modules/,
  /\.git/,
  /\.vscode/,
  /\.idea/,
  /\.gitignore/,
  /\.gitkeep/,
  /\.DS_Store/,
  /\.DS_Store/
].map((i) => new RegExp(i))
const result = batchRegQueryAndReturnResult(dirPath, regexPattern, ignoreFilesPatterns, true)

const writeFilePath = path.join('src/query/md/query-batch-result.md')
writeFile(writeFilePath, result)
