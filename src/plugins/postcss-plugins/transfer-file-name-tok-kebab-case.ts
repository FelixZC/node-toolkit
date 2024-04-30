/**
 * 驼峰命名转化的PostCSS插件
 * 该插件主要作用于处理CSS规则和@规则中的声明（decls），对其中的URL和require语句进行路径转换处理。
 */
import { isPath, transferRef } from '../../utils/common'
import { AcceptedPlugin as PostcssPlugin, AtRule, Rule } from 'postcss'

/**
 * 对CSS规则（Rule）或@规则（AtRule）内的声明（decls）进行处理，
 * 主要用于将URL和require语句中的相对路径转换为绝对路径。
 * @param rule CSS规则或@规则对象
 */
const transferHandler = (rule: Rule | AtRule) => {
  // 遍历规则内的所有声明
  rule.walkDecls((decl) => {
    // 定义用于匹配url和require语句的正则表达式
    const urlReg = /(?:url|require)\(['"`]?([\s\S]*?)['"`]?\)/
    let result = urlReg.exec(decl.value) // 使用正则匹配声明的值

    if (result) {
      // 如果匹配成功且路径为相对路径，则进行路径转换处理
      if (isPath(result[1])) {
        decl.value = transferRef(decl.value)
      }
    }
  })
  const atRule = rule as AtRule

  // 如果是@规则，对其参数进行路径转换处理
  if (atRule.params) {
    atRule.params = transferRef(atRule.params)
  }
}

/**
 * 定义一个PostCSS插件，主要包含Once处理函数。
 * @returns 返回符合PostCSS插件规范的对象
 */
const plugin = (): PostcssPlugin => ({
  Once(root) {
    // 遍历根节点下的所有规则和@规则，应用transferHandler函数进行处理
    root.walkRules(transferHandler)
    root.walkAtRules(transferHandler)
  },

  postcssPlugin: 'postcss-reverse-props' // 指定插件名称
})

plugin.postcss = true // 标记为PostCSS插件
export default plugin
