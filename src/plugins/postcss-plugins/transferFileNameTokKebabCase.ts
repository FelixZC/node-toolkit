import { AcceptedPlugin as PostcssPlugin, Rule, AtRule } from 'postcss'
import { isPath, transferRef } from '../../utils/common'
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
  if (atRule.params && !atRule.params.includes('$')) {
    atRule.params = transferRef(atRule.params)
  }
}
const plugin = (): PostcssPlugin => ({
  postcssPlugin: 'postcss-reverse-props',
  Once(root) {
    root.walkRules(transferHandler)
    root.walkAtRules(transferHandler)
  }
})

plugin.postcss = true

export default plugin
