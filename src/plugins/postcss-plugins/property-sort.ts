import { AcceptedPlugin, Rule, AtRule, ChildNode, Root, Declaration } from 'postcss'

const pluginName = 'postcss-sort-props-alphabetically'

// 辅助函数，用于在给定的 Rule 中排序属性
const sortRuleDeclarations = (rule: Rule | AtRule): void => {
  // 过滤出所有 Declaration 类型的子节点
  const declarations = rule.nodes?.filter((node) => node.type === 'decl') as Declaration[]
  const restNodes = rule.nodes?.filter((node) => node.type !== 'decl') as ChildNode[]
  // 如果存在声明，则进行排序
  declarations.sort((a, b) => a.prop.localeCompare(b.prop))
  // 更新当前 rule 的子节点为排序后的属性声明
  rule.nodes = [...declarations, ...restNodes]
  // 递归排序嵌套的规则
  rule.walkRules(sortRuleDeclarations)
}

// 主插件函数
const plugin = (): AcceptedPlugin => ({
  postcssPlugin: pluginName,
  Once(root: Root) {
    // 递归排序所有普通规则中的属性
    root.walkRules(sortRuleDeclarations)

    // 递归排序所有@规则中的属性
    root.walkAtRules(sortRuleDeclarations)
  }
})

// 标记为 PostCSS 插件
plugin.postcss = true

// 导出插件
export default plugin
