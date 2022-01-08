/**
 * This removes jest.disableAutomock() calls. It handles cases where
 * `disableAutomock` is part of a chain
 * (ex. `jest.disableAutomock().mock('xyz')`)
 * It also preserves any header comments at the top of the file if
 * the the codemod completely deletes the first line.
 */

module.exports = function (file, api) {
  const j = api.jscodeshift
  const root = j(file.source)
  let mutations = 0

  const DISABLE_AUTOMOCK_CALLS = {
    autoMockOff: 'disableAutomock',
    disableAutomock: 'disableAutomock'
  }

  const isGeneratedFile = () => {
    const rootElement = root.get(0).node.program.body[0]
    const headers = !!rootElement && rootElement.comments
    return headers && headers.length > 0 && headers[0].value.indexOf('@generated') > -1
  }

  const isJestCall = (node) =>
    node.name == 'jest' ||
    (node.type == 'CallExpression' &&
      node.callee.type == 'MemberExpression' &&
      isJestCall(node.callee.object))

  const isRootElement = (path) =>
    path && path.parentPath && path.parentPath.value === root.get(0).node.program.body[0]

  const removeCalls = (calls) => {
    const jestUnmocks = root.find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: isJestCall,
        property: {
          name: (name) => calls[name]
        }
      }
    })
    // do these one at a time, then search for more
    // otherwise the list self-clobbers
    if (jestUnmocks.size() > 0) {
      const onlyThisOne = jestUnmocks.paths()[0]
      onlyThisOne.replace(onlyThisOne.value.callee.object)
      return 1 + removeCalls(calls)
    }
    return 0
  }

  const removeDanglingJests = () => {
    let header
    const danglers = root
      .find(j.Identifier, { name: 'jest' })
      .filter((path) => path.parentPath.value.type === j.ExpressionStatement.name)
    if (danglers.size() > 0) {
      header = getHeader(danglers.paths()[0])
    }
    danglers.forEach((path) => {
      path.parentPath.replace(null)
    })
    restoreHeader(header)
    return danglers.size()
  }

  const getHeader = (path) => {
    if (isRootElement(path)) {
      return path.parentPath.value.comments
    }
    return null
  }

  const restoreHeader = (header) => {
    const body = root.get(0).node.program.body.filter((a) => !!a)
    if (header && body.length > 0) {
      if (body[0].comments) {
        body[0].comments.splice(0, 0, ...header)
      } else {
        body[0].comments = header
      }
    }
  }

  if (!isGeneratedFile()) {
    mutations += removeCalls(DISABLE_AUTOMOCK_CALLS)
    mutations += removeDanglingJests()
  }

  const printOptions = {
    quote: 'single',
    trailingComma: true,
    wrapColumn: 80
  }
  return mutations > 0 ? root.toSource(printOptions) : null
}
