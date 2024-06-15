import { AcceptedPlugin, AtRule, Declaration, Root, Rule } from 'postcss'
import { isPath, transferRef } from '../../utils/common'
const transferHandler = (node: Rule | AtRule) => {
  // 检查节点是否具有 'walkDecls' 方法
  if ('walkDecls' in node) {
    node.walkDecls((decl: Declaration) => {
      // 定义用于匹配 url 和 require 语句的正则表达式
      const urlReg = /(?:url|require)\(['"`]?([^'"`]+)['"`]?\)/
      let result = urlReg.exec(decl.value) // 使用正则匹配声明的值

      if (result) {
        // 如果匹配成功且路径为相对路径，则进行路径转换处理
        if (isPath(result[1])) {
          // 更新声明的值
          decl.value = transferRef(decl.value)
        }
      }
    })
  }

  // 如果是 @ 规则，对其参数进行路径转换处理
  if (node.type === 'atrule' && node.params) {
    node.params = transferRef(node.params)
  }
}
const plugin = (): AcceptedPlugin => ({
  postcssPlugin: 'postcss-reverse-props',
  // 指定插件名称

  Once(root: Root) {
    // 遍历根节点下的所有规则和 @ 规则，应用 transferHandler 函数进行处理
    root.walkRules(transferHandler)
    root.walkAtRules(transferHandler)
  }
})

// 标记为 PostCSS 插件
plugin.postcss = true
export default plugin
