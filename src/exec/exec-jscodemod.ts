import type { Transform } from 'jscodeshift'
import * as exec from './index'
const jscodemodeList = ['../plugins/jscodemods/object-sort-key']

try {
  const codemodList: Transform[] = jscodemodeList.map((filePath) => {
    const result = require(filePath)

    if (result.default) {
      return result.default
    }

    return result
  })
  exec.execCodemod(codemodList)
} catch (e) {
  console.log('获取someCodemod失败')
  console.log(e)
}
