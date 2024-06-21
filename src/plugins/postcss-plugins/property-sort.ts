import { AcceptedPlugin, AtRule, Comment, Declaration, Root, Rule } from 'postcss'
const pluginName = 'postcss-sort-props-alphabetically'
const sortRuleDeclarations = (rule: Rule | AtRule): void => {
  if (rule.nodes) {
    // 过滤出所有 Declaration 类型的子节点
    const declarations = rule.nodes.filter((node) => node.type === 'decl') as Declaration[]
    const restNodes = rule.nodes.filter((node) => node.type !== 'decl') as (
      | Comment
      | AtRule
      | Rule
    )[]

    // 如果存在声明，则进行排序
    if (declarations && declarations.length > 0) {
      declarations.sort((a, b) => a.prop.localeCompare(b.prop))
    }
    // 创建一个映射，将每个声明节点与其相邻的注释节点关联起来
    const declarationToCommentsMap = new Map<Declaration, Comment[]>()

    // 遍历原始 nodes 数组，构建声明节点和注释节点的映射关系
    for (let i = 0; i < rule.nodes.length; i++) {
      const node = rule.nodes[i]
      if (node.type === 'decl') {
        declarationToCommentsMap.set(node, [])
      } else if (node.type === 'comment' && i > 0 && rule.nodes[i - 1].type === 'decl') {
        const prevDeclaration = rule.nodes[i - 1] as Declaration
        declarationToCommentsMap.get(prevDeclaration)?.push(node)
      } else if (node.type === 'comment' && i > 0 && rule.nodes[i - 1].type === 'comment') {
        //注释不规范，同事两行泪
      }
    }

    // 重置 rule 的 nodes 数组
    rule.nodes = []

    // 插入排序后的声明节点和它们相邻的注释节点
    for (const declaration of declarations) {
      rule.nodes.push(declaration)
      const comments = declarationToCommentsMap.get(declaration) || []
      rule.nodes.push(...comments)
    }

    // 插入剩余的非声明和非注释节点
    for (const node of restNodes) {
      if (node.type !== 'comment') {
        rule.nodes.push(node)
      }
    }
  }
}
const plugin = (): AcceptedPlugin => ({
  postcssPlugin: pluginName,
  Once(root: Root) {
    // 递归排序所有普通规则中的属性
    root.walkRules(sortRuleDeclarations)

    // 递归排序所有@规则中的属性
    root.walkAtRules(sortRuleDeclarations)
  }
})
plugin.postcss = true
export default plugin
