// 导入所需模块
import path from 'path'
import { writeFile } from '../utils/fs'
import { Exec } from './index'

/**
 * 公共方法，用于对指定目录进行文件分类，并输出分类结果
 * @param {string} dirPath - 需要分类的目录路径
 */
export function classifyFiles(dir: string) {
  // 将传入的目录路径与基本路径拼接

  // 创建Exec实例
  const exec = new Exec(dir)

  // 执行文件分类
  const result = exec.classifyFilesGroup()

  return result
}

const result = classifyFiles(path.join('src copy'))
// 构建输出文件的路径
const outputPath = path.join('src/query/json/files-group.json')
// 将分类结果写入文件
writeFile(outputPath, result)
