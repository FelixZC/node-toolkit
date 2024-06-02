/**
 * 执行目录下的批量正则查询并输出结果到文件
 *
 * 本脚本使用正则表达式对指定目录下的文件内容进行批量查询，
 * 然后将查询结果写入到一个Markdown文件中。这样做的目的是
 * 为了方便对大量文本数据进行统一的模式匹配和分析。
 *
 * 使用的正则表达式定义了两种匹配模式：日期(Date)和学期(Term)，
 * 这两种模式可以通过正则表达式的匹配操作进行灵活的查询。
 *
 * @author Your Name
 */
import { writeFile } from '../utils/fs'
import { Exec } from './index'

const exec = new Exec()
const reg = /(\w+)?(Date|Term)\b/gi
const result = exec.batchRegQuery(reg)
const writeFilePath = 'src/query/md/query-batch-result.md'
writeFile(writeFilePath, result)
