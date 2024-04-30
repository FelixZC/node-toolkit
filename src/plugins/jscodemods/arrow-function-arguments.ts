//@ts-nocheck
import { Transform } from 'jscodeshift'
/**
 * 主要转换函数：将箭头函数中的 'arguments' 替换为 'args'。
 * @param {object} file - 待转换的文件对象。
 * @param {object} api - jscodeshift 提供的转换工具对象。
 * @param {object} options - 转换选项。
 * @returns {string|null} 如果有转换发生，则返回转换后的代码字符串；否则返回 null。
 */
const transformer: Transform = (file, api, options) => {
  const j = api.jscodeshift
  const printOptions = options.printOptions || {
    quote: 'single'
  }
  const root = j(file.source)
  const ARGUMENTS = 'arguments'
  const ARGS = 'args'

  // 创建一个新的箭头函数表达式，将给定的参数合并到函数中。
  const createArrowFunctionExpression = (fn, args) =>
    j.arrowFunctionExpression((fn.params || []).concat(j.restElement(args)), fn.body, fn.generator)

  // 过滤成员表达式，排除它们的转换。
  const filterMemberExpressions = (path) => path.parent.value.type !== 'MemberExpression'

  // 判断箭头函数是否应该被转换，基于其上下文和内容。
  const filterArrowFunctions = (path) => {
    let localPath = path

    while (localPath.parent) {
      switch (localPath.value.type) {
        case 'ArrowFunctionExpression':
          if (
            j(localPath)
              .find(j.Identifier, {
                name: ARGS
              })
              .size()
          ) {
            return false
          }

          return true

        case 'Function':
          return false

        case 'FunctionDeclaration':
          return false

        case 'FunctionExpression':
          return false

        case 'MethodDeclaration':
          return false

        default:
          break
      }

      localPath = localPath.parent
    }

    return false
  }

  // 更新函数调用中的 'arguments' 使用 'args'，并更新相应的箭头函数表达式以接受 'args'。
  const updateArgumentsCalls = (path) => {
    let afPath = path

    while (afPath.parent) {
      if (afPath.value.type == 'ArrowFunctionExpression') {
        break
      }

      afPath = afPath.parent
    }

    const { value: fn } = afPath
    const { params } = fn
    const param = params[params.length - 1]
    let args

    if (param && param.type == 'RestElement') {
      params.pop()
      args = param.argument
    } else {
      args = j.identifier(ARGS)
    }

    j(afPath).replaceWith(createArrowFunctionExpression(fn, args))

    if (params.length) {
      j(path).replaceWith(j.arrayExpression(params.concat(j.spreadElement(args))))
    } else {
      j(path).replaceWith(args)
    }
  }

  // 在代码中应用转换，识别并更新使用 'arguments' 的箭头函数。
  const didTransform =
    root
      .find(j.Identifier, {
        name: ARGUMENTS
      })
      .filter(filterMemberExpressions)
      .filter(filterArrowFunctions)
      .forEach(updateArgumentsCalls)
      .size() > 0
  // 如果有转换发生，则返回转换后的代码；否则返回 null。
  return didTransform ? root.toSource(printOptions) : null
}

export default transformer
