import type { ElementNode, TemplateChildNode } from "@vue/compiler-core";
/**
 * 定义一个模板访问者接口，通过标签名索引，提供对模板节点的访问和转换逻辑。
 */
export interface TemplateVisitor {
  [tag: string]: (
    node: ElementNode,
    parent?: ElementNode,
  ) => ElementNode | undefined;
}
/*  遍历模板抽象语法树 */

/**
 * 使用给定的访问者对象遍历和处理模板抽象语法树（AST）。
 * @param ast - 模板的抽象语法树，起点为根节点。
 * @param visitor - 访问者对象，包含对特定标签的处理逻辑。
 */
export const traverserTemplateAst = (
  ast: ElementNode,
  visitor: TemplateVisitor,
) => {
  /**
   * 遍历并处理节点数组。
   * @param array - 待处理的模板子节点数组。
   * @param parent - 父节点，标识当前节点的父级上下文。
   */
  function traverseArray(array: TemplateChildNode[], parent: ElementNode) {
    array.forEach((child) => {
      traverseNode(child as ElementNode, parent);
    });
  }

  /**
   * 遍历单个节点及其子节点。
   * @param node - 当前遍历到的节点。
   * @param parent - 父节点，标识当前节点的父级上下文。
   */
  function traverseNode(node: ElementNode, parent?: ElementNode) {
    // 进入节点时的通用处理
    visitor.enter && visitor.enter(node, parent);
    // 对当前节点基于标签的特殊处理
    visitor[node.tag] && visitor[node.tag](node, parent);
    // 递归处理子节点
    node.children && traverseArray(node.children, node);
    // 离开节点时的通用处理
    visitor.exit && visitor.exit(node, parent);
  }
  traverseNode(ast); // 从根节点开始遍历
};
