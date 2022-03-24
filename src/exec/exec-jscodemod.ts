import * as exec from './index'
import type { Transform } from 'jscodeshift'
const jscodemodeList = [
  '../plugins/jscodemods/arrow-function',
  '../plugins/jscodemods/arrow-function-arguments',
  '../plugins/jscodemods/invalid-requires',
  '../plugins/jscodemods/no-vars',
  '../plugins/jscodemods/object-shorthand',
  '../plugins/jscodemods/object-sort-key',
  '../plugins/jscodemods/outline-require',
  '../plugins/jscodemods/rm-copy-properties',
  '../plugins/jscodemods/rm-merge',
  '../plugins/jscodemods/rm-object-assign',
  '../plugins/jscodemods/rm-requires',
  '../plugins/jscodemods/template-literals',
  '../plugins/jscodemods/unchain-variables',
  '../plugins/jscodemods/unquote-properties',
  '../plugins/jscodemods/updated-computed-props'
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
