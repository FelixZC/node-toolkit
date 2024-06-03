/**
 * 执行目录下的批量正则查询并输出结果到文件
 *
 */
import { writeFile } from '../utils/fs'
import { Exec } from './index'

const exec = new Exec()
const reg = /(\w+)?(Date|Term)\b/gi
const result = exec.batchRegQuery(reg)
const writeFilePath = 'src/query/md/query-batch-result.md'
writeFile(writeFilePath, result)
