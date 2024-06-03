/**
 * 获取项目属性注释
 */
import { writeFile } from '../utils/fs'
import { Exec } from './index'
const exec = new Exec()
const attributesDescriptionTable = exec.getAttrsAndAnnotation()
writeFile('src/query/md/attributes-description-table.md', attributesDescriptionTable)
