/**
 * The following function is adapted from https://github.com/psalaets/vue-sfc-descriptor-to-string/blob/master/index.js
 */

/**
 * The MIT License (MIT)
 * Copyright (c) 2018 Paul Salaets
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import type { SFCBlock, SFCDescriptor } from '@vue/compiler-sfc'
export { parse } from '@vue/compiler-sfc'

/**
 * 将SFC描述符对象转换为字符串形式。
 * @param sfcDescriptor SFC描述符，包含模板、脚本、样式等信息。
 * @returns 返回处理后的SFC字符串。
 */
export function stringify(sfcDescriptor: SFCDescriptor) {
  // 解构SFC描述符中的各部分
  const { customBlocks, script, scriptSetup, styles, template } = sfcDescriptor

  // 将所有块按类型排序，并处理不存在的块
  return (
    (
      [template, script, scriptSetup, ...styles, ...customBlocks].filter(
        (block) => block != null
      ) as Array<NonNullable<SFCBlock>>
    ) /* 根据块的源位置进行排序*/
      .sort((a, b) => a.loc.start.offset - b.loc.start.offset)
      // 为每个块生成打开和关闭标签，并计算相关位置信息
      .map((block) => {
        const openTag = makeOpenTag(block)
        const closeTag = makeCloseTag(block)
        return {
          ...block,
          closeTag,
          endOfCloseTag: block.loc.end.offset + closeTag.length,
          endOfOpenTag: block.loc.start.offset,
          openTag,
          startOfCloseTag: block.loc.end.offset,
          startOfOpenTag: block.loc.start.offset - openTag.length
        }
      }) // 生成SFC的源码字符串
      .reduce((sfcCode, block, index, array) => {
        const first = index === 0
        let newlinesBefore = 0

        // 计算当前块前应添加的新行数
        if (first) {
          newlinesBefore = block.startOfOpenTag
        } else {
          const prevBlock = array[index - 1]
          newlinesBefore = block.startOfOpenTag - prevBlock.endOfCloseTag
        }
        newlinesBefore = newlinesBefore < 0 ? 0 : newlinesBefore
        // 按计算出的新行数和块内容生成SFC代码字符串
        return (
          sfcCode + '\n'.repeat(newlinesBefore) + block.openTag + block.content + block.closeTag
        )
      }, '')
  )
}

/**
 * 生成块的打开标签。
 * @param block SFC块信息。
 * @returns 返回生成的打开标签字符串。
 */
function makeOpenTag(block: SFCBlock) {
  let source = `<${block.type}`
  source += Object.keys(block.attrs)
    .sort()
    .map((name) => {
      const value = block.attrs[name]

      // 根据属性值生成属性字符串
      if (value === true) {
        return name
      }
      return `${name}="${value}"`
    })
    .map((attr) => ` ${attr}`)
    .join('')
  return `${source}>`
}

/**
 * 生成块的关闭标签。
 * @param block SFC块信息。
 * @returns 返回生成的关闭标签字符串。
 */
function makeCloseTag(block: SFCBlock) {
  return `</${block.type}>\n`
}
