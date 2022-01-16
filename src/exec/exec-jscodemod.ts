import * as exec from './index'
import type { Transform } from 'jscodeshift'
const jscodemodeList = [
  '../plugins/jscodemods/arrow-function-arguments',
  '../plugins/jscodemods/arrow-function',
  '../plugins/jscodemods/expect',
  '../plugins/jscodemods/flow-bool-to-boolean',
  '../plugins/jscodemods/invalid-requires',
  '../plugins/jscodemods/no-reassign-params',
  '../plugins/jscodemods/no-vars',
  '../plugins/jscodemods/object-shorthand',
  '../plugins/jscodemods/object-sort-key',
  '../plugins/jscodemods/outline-require',
  '../plugins/jscodemods/remove-consoles',
  '../plugins/jscodemods/rm-copyProperties',
  '../plugins/jscodemods/rm-merge',
  '../plugins/jscodemods/rm-object-assign',
  '../plugins/jscodemods/rm-requires',
  '../plugins/jscodemods/template-literals',
  '../plugins/jscodemods/touchable',
  '../plugins/jscodemods/trailing-commas',
  '../plugins/jscodemods/unchain-variables',
  '../plugins/jscodemods/unquote-properties',
  '../plugins/jscodemods/updated-computed-props',
  '../plugins/jscodemods/use-strict',
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
  console.log(e)
}
