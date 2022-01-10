const path = require('path')

module.exports = function (file, api, options = {}) {
  if (
    !file.path.includes(path.sep + '__tests__' + path.sep) &&
    !file.path.includes(path.sep + '__mocks__' + path.sep)
  ) {
    return null
  }

  const j = api.jscodeshift
  const printOptions = options.printOptions || {
    quote: 'single',
  }
  const root = j(file.source)
  const JEST = 'jest'

  const isJestFn = (node) =>
    ['mock', 'unmock', 'disableAutomock'].includes(node.name)

  const removeCalls = (moduleNames) => {
    let mutated = false

    const isJest = (node) =>
      node.type == 'CallExpression' &&
      node.callee.type == 'MemberExpression' &&
      isJestFn(node.callee.property)

    const shouldUpdate = (node) =>
      node.type == 'CallExpression' &&
      node.callee.type == 'MemberExpression' &&
      node.callee.property.name == 'mock' &&
      node.arguments.some((arg) => moduleNames.includes(arg.value))

    const descend = (parent, node) => {
      if (node && isJest(node)) {
        if (shouldUpdate(node)) {
          mutated = true
          parent.callee.object = node.callee.object
          node = parent
        }

        descend(node, node.callee.object)
      }
    }

    const update = (statement) => {
      const expression = statement.expression

      if (isJest(expression)) {
        descend(expression, expression.callee.object)
      }

      if (shouldUpdate(expression)) {
        mutated = true
        statement.expression = expression.callee.object
        update(statement)
        return true
      }
    }

    const program = root.get(0).node.program
    const body = program.body.filter((statement, index) => {
      if (statement.type === 'ExpressionStatement' && update(statement)) {
        if (
          statement.expression.type == 'Identifier' &&
          statement.expression.name == JEST
        ) {
          return false
        }
      }

      return true
    })
    program.body = body
    return mutated
  }

  const mutations = removeCalls(options.moduleNames)
  return mutations ? root.toSource(printOptions) : null
}
