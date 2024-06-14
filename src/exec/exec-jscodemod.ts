import { Exec } from './index'
import path from 'path'
import type { Transform } from 'jscodeshift'

/**
 * 执行 JSCodeMod 模板的公共方法。
 * @param jscodemodeList 需要执行的 JSCodeMod 模板路径列表。
 */
export const executeJSCodemods = async (
  dir: string,
  jscodemodeList: string[],
  isUseIgnoredFiles: boolean
) => {
  const exec = new Exec(dir, isUseIgnoredFiles)

  try {
    // 将模板路径列表映射为具体的 Transform 函数数组
    const codemodList: Transform[] = jscodemodeList.map((filePath) => {
      const result = require(filePath)

      // 确保 result.default 或 result 本身是 JSCodeMod 转换函数
      if (result.default && typeof result.default === 'function') {
        return result.default
      }
      return result
    })

    // 执行 JSCodeMod 模板
    await exec.execCodemod(codemodList)
  } catch (e) {
    console.warn('执行 JSCodeMod 模板时发生错误:', e)
  }
}

// 示例用法：
export function test() {
  const jscodemodeList = [
    '../plugins/jscodemods/arrow-function',
    '../plugins/jscodemods/no-vars',
    '../plugins/jscodemods/object-shorthand',
    '../plugins/jscodemods/rm-object-assign',
    '../plugins/jscodemods/rm-requires',
    '../plugins/jscodemods/template-literals',
    '../plugins/jscodemods/unchain-variables'
  ]
  // 调用公共方法执行 JSCodeMod 模板
  executeJSCodemods(path.join('src copy'), jscodemodeList, true)
}
// test()
