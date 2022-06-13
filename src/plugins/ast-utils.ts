import type { ElementNode, TemplateChildNode } from '@vue/compiler-core'
export interface TemplateVisitor {
  [tag: string]: (node: ElementNode, parent?: ElementNode) => ElementNode | undefined
}
/*  遍历模板抽象数 */

export const traverserTemplateAst = (ast: ElementNode, visitor: TemplateVisitor) => {
  function traverseArray(array: TemplateChildNode[], parent: ElementNode) {
    array.forEach((child) => {
      traverseNode(child as ElementNode, parent)
    })
  }

  function traverseNode(node: ElementNode, parent?: ElementNode) {
    visitor.enter && visitor.enter(node, parent)
    visitor[node.tag] && visitor[node.tag](node, parent)
    node.children && traverseArray(node.children, node)
    visitor.exit && visitor.exit(node, parent)
  }

  traverseNode(ast)
}
