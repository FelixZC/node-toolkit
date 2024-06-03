/**
 * 文件分类
 */
import { writeFile } from '../utils/fs'
import { Exec } from './index'
const exec = new Exec()

const result = exec.classifyFilesGroup()
writeFile('src/query/json/files-group.json', result)

const resultRepeat = exec.classifyFilesGroupByRepeat()
writeFile('src/query/json/files-group-repeat.json', resultRepeat)
