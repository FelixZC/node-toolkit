/**
 * 驼峰命名转化
 */
import { isPath, transferRef } from '../../utils/common'
import { AcceptedPlugin as PostcssPlugin, AtRule, Rule } from 'postcss'

const transferHandler = (rule: Rule | AtRule) => {
  rule.walkDecls((decl) => {
    const urlReg = /(?:url|require)\(['"`]?([\s\S]*?)['"`]?\)/
    let result = urlReg.exec(decl.value)

    if (result) {
      if (isPath(result[1])) {
        decl.value = transferRef(decl.value)
      }
    }
  })
  const atRule = rule as AtRule

  if (atRule.params) {
    atRule.params = transferRef(atRule.params)
  }
}

const plugin = (): PostcssPlugin => ({
  Once(root) {
    root.walkRules(transferHandler)
    root.walkAtRules(transferHandler)
  },

  postcssPlugin: 'postcss-reverse-props'
})

plugin.postcss = true
export default plugin
