import { Exec } from '../exec'
import path from 'path'
import { writeFile } from '../utils/fs'

/**
 * 获取项目属性注释并写入文件
 * @param {string} dir - 项目目录路径
 * @returns {string} attributesDescriptionTable - 属性描述表的字符串
 */
export async function getAttributesDescriptionTable(dir: string, isUseIgnoredFiles: boolean) {
  // 创建Exec实例
  const exec = new Exec(dir, isUseIgnoredFiles)

  // 获取属性和注释
  const attributesDescriptionTable = await exec.getAttrsAndAnnotation()

  // 返回属性描述表
  return attributesDescriptionTable
}
export async function test() {
  const dir = path.join('src copy')
  const attributesDescriptionTable = await getAttributesDescriptionTable(dir, true)
  const out = path.join('src/query/md/attributes-description-table.md')
  writeFile(out, attributesDescriptionTable)
}
