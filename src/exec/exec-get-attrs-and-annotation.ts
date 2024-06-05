const path = require('path')
const { writeFile } = require('../utils/fs')
const { Exec } = require('./index')

/**
 * 获取项目属性注释并写入文件
 * @param {string} dir - 项目目录路径
 * @returns {string} attributesDescriptionTable - 属性描述表的字符串
 */
export function getAttributesDescriptionTable(dir: string) {
  // 创建Exec实例
  const exec = new Exec(dir)

  // 获取属性和注释
  const attributesDescriptionTable = exec.getAttrsAndAnnotation()

  // 返回属性描述表
  return attributesDescriptionTable
}

// 使用示例
const dir = path.join(__dirname, 'src copy')
const attributesDescriptionTable = getAttributesDescriptionTable(dir)

// 写入文件
const out = path.join(__dirname, 'src/query/md/attributes-description-table.md')
writeFile(out, attributesDescriptionTable)
