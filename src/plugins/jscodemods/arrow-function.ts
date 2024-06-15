//@ts-nocheck
import { Transform } from 'jscodeshift'
/**
 * 主要的代码转换器函数，旨在将指定的函数表达式转换为箭头函数表达式。
 * @param {object} file 包含待处理源代码的文件对象。
 * @param {object} api 提供了一组用于操作源代码的工具方法的对象。
 * @param {object} options 包含转换配置选项的对象，例如打印选项和最大宽度限制。
 * @returns {string|null} 如果有函数被转换，则返回转换后的源代码字符串；否则返回null。
 */
const transformer: Transform = (file, api, options) => {
  // 初始化codeshift工具方法
  const j = api.jscodeshift
  // 设置或默认打印选项
  const printOptions = options.printOptions || {
    quote: 'single'
  }
  // 解析源代码根节点
  const root = j(file.source)

  /**
   * 获取函数体的语句，根据条件可能返回表达式或直接返回函数体。
   * @param {object} fn 表示函数的AST节点。
   * @returns {object} 根据条件可能返回的表达式或函数体本身。
   */
  const getBodyStatement = (fn) => {
    // 处理最大宽度选项
    const maxWidth = options['max-width'] ? options['max-width'] - 1 : undefined

    // 针对只有一个语句的块状函数体进行处理
    if (fn.body.type == 'BlockStatement' && fn.body.body.length == 1) {
      const inner = fn.body.body[0]
      // 合并函数体和内部语句的注释
      const comments = (fn.body.comments || []).concat(inner.comments || [])

      // 对于可内联的单个表达式进行处理
      if (options['inline-single-expressions'] && inner.type == 'ExpressionStatement') {
        inner.expression.comments = (inner.expression.comments || []).concat(comments)
        return inner.expression
      }

      // 对于返回语句进行处理，考虑函数体长度和最大宽度限制
      if (inner.type == 'ReturnStatement') {
        // 处理空返回语句
        if (inner.argument === null) {
          fn.body.body = []
          return fn.body
        }

        // 计算转换后的函数长度是否超过最大宽度
        const lineStart = fn.loc.start.line
        const originalLineLength = fn.loc.lines.getLineLength(lineStart)
        const approachDifference = 'function(a, b) {'.length - '(a, b) => );'.length
        const argumentLength = inner.argument.end - inner.argument.start
        const newLength = originalLineLength + argumentLength - approachDifference
        const tooLong = maxWidth && newLength > maxWidth

        // 如果长度未超过最大宽度，则将返回语句转换为表达式
        if (!tooLong) {
          inner.argument.comments = (inner.argument.comments || []).concat(comments)
          return inner.argument
        }
      }
    }

    // 如果不满足转换条件，返回原始函数体
    return fn.body
  }

  /**
   * 创建一个箭头函数表达式节点。
   * @param {object} fn 表示函数的AST节点。
   * @returns {object} 新创建的箭头函数表达式节点。
   */
  const createArrowFunctionExpression = (fn) => {
    const arrowFunction = j.arrowFunctionExpression(fn.params, getBodyStatement(fn), false)
    // 保留原有函数节点的注释和async属性
    arrowFunction.comments = fn.comments
    arrowFunction.async = fn.async
    return arrowFunction
  }

  // 查找并替换所有符合条件的bind调用
  const replacedBoundFunctions =
    root
      .find(j.CallExpression, {
        callee: {
          object: {
            generator: false,
            type: 'FunctionExpression'
          },
          property: {
            name: 'bind',
            type: 'Identifier'
          },
          type: 'MemberExpression'
        }
      })
      .filter(
        (path) =>
          !path.value.callee.object.id &&
          path.value.arguments &&
          path.value.arguments.length == 1 &&
          path.value.arguments[0].type == 'ThisExpression'
      )
      .forEach((path) => {
        // 合并相关注释
        const comments = path.value.comments || []
        for (const node of [
          path.value.callee,
          path.value.callee.property,
          path.value.arguments[0]
        ]) {
          for (const comment of node.comments || []) {
            comment.leading = false
            comment.trailing = true
            comments.push(comment)
          }
        }
        const arrowFunction = createArrowFunctionExpression(path.value.callee.object)
        arrowFunction.comments = (arrowFunction.comments || []).concat(comments)
        j(path).replaceWith(arrowFunction)
      })
      .size() > 0

  // 查找并替换所有符合条件的函数表达式为箭头函数表达式
  const replacedCallbacks =
    root
      .find(j.FunctionExpression, {
        generator: false
      })
      .filter((path) => {
        const isArgument =
          path.parentPath.name === 'arguments' && path.parentPath.value.indexOf(path.value) > -1
        const noThis = j(path).find(j.ThisExpression).size() == 0
        const notNamed = !path.value.id || !path.value.id.name
        const noArgumentsRef =
          j(path)
            .find(j.Identifier)
            .filter(
              (idPath) =>
                idPath.node.name === 'arguments' &&
                idPath.scope.depth === path.get('body').scope.depth
            )
            .size() === 0
        return isArgument && noThis && notNamed && noArgumentsRef
      })
      .forEach((path) => j(path).replaceWith(createArrowFunctionExpression(path.value)))
      .size() > 0

  // 根据是否进行了替换，返回转换后的源代码或null
  return replacedBoundFunctions || replacedCallbacks ? root.toSource(printOptions) : null
}
export default transformer
