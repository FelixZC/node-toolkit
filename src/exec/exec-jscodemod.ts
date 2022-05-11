/**
 * 执行jscodemode模板
 */
import * as exec from './index'
import type { Transform } from 'jscodeshift'
const jscodemodeList = [
  '../plugins/jscodemods/arrow-function-arguments',
  '../plugins/jscodemods/arrow-function',
  '../plugins/jscodemods/no-reassign-params',
  '../plugins/jscodemods/no-vars',
  '../plugins/jscodemods/object-shorthand',
  '../plugins/jscodemods/rm-object-assign',
  '../plugins/jscodemods/rm-requires',
  '../plugins/jscodemods/template-literals',
  '../plugins/jscodemods/unchain-variables'
]

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
  console.warn(e)
}
