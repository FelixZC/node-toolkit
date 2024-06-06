// 导入所需模块
import path from 'path'
import { writeFile } from '../utils/fs'
import { Exec } from './index'

/**
 * 公共方法，用于对指定目录进行文件分类，并输出分类结果
 * @param {string} dirPath - 需要分类的目录路径
 */
export function getProjectTree(dir: string) {
  const exec = new Exec(dir)
  return exec.getProjectTree()
}

export function classifyFilesByExtname(dir: string) {
  const exec = new Exec(dir)
  const result = exec.classifyFilesByExtname()
  return result
}

export function classifyFilesByBasename(dir: string) {
  const exec = new Exec(dir)
  const result = exec.classifyFilesByBasename()
  return result
}

export function classifyFilesFirstBasenameThenExtname(dir: string) {
  const exec = new Exec(dir)
  const result = exec.classifyFilesFirstBasenameThenExtname()
  return result
}

const result = classifyFilesByExtname(path.join('src copy'))
// 构建输出文件的路径
const outputPath = path.join('src/query/json/files-group.json')
// 将分类结果写入文件
writeFile(outputPath, result)
