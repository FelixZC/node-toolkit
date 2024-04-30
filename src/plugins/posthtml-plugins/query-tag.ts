/**
 * 标签查询插件
 * 该插件用于遍历PostHTML树，查找并记录特定标签，然后将记录的标签列表作为消息添加到树中。
 * @param {PostHTML.Tree} tree - PostHTML的AST树，表示HTML文档的抽象结构。
 * @returns {PostHTML.Tree} 返回经过处理的PostHTML树，树中包含了查询到的标签列表消息。
 */
import type PostHTML from 'posthtml'
const tagList: string[] = [] // 用于存储查询到的标签列表

const queryTag: PostHTML.Plugin<unknown> = (tree) => {
  // 遍历树中所有节点，查找匹配‘wp-proj-work-bench’标签的节点
  tree.match(
    {
      tag: 'wp-proj-work-bench'
    },
    (node) => {
      // 如果节点有属性，则遍历属性，查找并记录名为‘tag’的属性值
      if (node.attrs) {
        for (const [key, value] of Object.entries(node.attrs)) {
          if (key === 'tag' && typeof value === 'string') {
            // 如果标签列表中不包含当前标签，则将其添加到列表中
            if (!tagList.includes(value)) {
              tagList.push(value)
            }
          }
        }
      }

      return node // 返回未修改的节点
    }
  )

  // 将标签列表作为消息添加到树的messages属性中
  ;(tree as any).messages.push({
    tagList
  })
}

export default queryTag
