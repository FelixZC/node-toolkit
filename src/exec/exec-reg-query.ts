/**
 * 初始化Exec实例，用于后续的正则表达式查询操作。
 * Exec类负责执行具体的页面正则查询任务。
 */
import * as fs from 'fs'
import { writeFile } from '../utils/fs'
import { Exec } from './index'

const exec = new Exec()
const reg = /(\w+)?(Date|Term)\b/gi
const filePath = 'src/query/md/query.md'
const content = fs.readFileSync(filePath, 'utf-8')
const result = exec.pageRegQuery(reg, content)
const writeFilePath = 'src/query/md/query-result.md'
writeFile(writeFilePath, result)
