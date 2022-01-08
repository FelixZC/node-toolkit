const path = require('path')

module.exports = function (file, api, options = {}) {
  if (
    !file.path.includes(path.sep + '__tests__' + path.sep) &&
    !file.path.includes(path.sep + '__mocks__' + path.sep)
  ) {
    return null
  }

  const j = api.jscodeshift
  const printOptions = options.printOptions || { quote: 'single' }
  const root = j(file.source)
  let mutations = 0

  const JEST_API = {
    dontMock: 'unmock',
    autoMockOff: 'disableAutomock',
    autoMockOn: 'enableAutomock'
  }

  const isJestCall = (node) =>
    node.name == 'jest' ||
    (node.type == 'CallExpression' &&
      node.callee.type == 'MemberExpression' &&
      isJestCall(node.callee.object))

  const updateAPIs = (apiMethods) =>
    (mutations += root
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: isJestCall,
          property: {
            name: (name) => apiMethods[name]
          }
        }
      })
      .forEach((p) => {
        const name = p.value.callee.property.name
        p.value.callee.property.name = apiMethods[name]
      })
      .size())

  const JEST_MOCK_FNS = {
    genMockFn: true,
    genMockFunction: true
  }

  const JEST_MOCK_IMPLEMENTATION = {
    mockImpl: true,
    mockImplementation: true
  }

  const updateMockFns = () => {
    mutations += root
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: {
            name: 'jest'
          },
          property: {
            name: (name) => JEST_MOCK_FNS[name]
          }
        }
      })
      .forEach((p) => {
        p.value.callee.property.name = 'fn'

        const parent = p.parent.node
        const grandParent = p.parent.parent.node
        if (
          parent.type == 'MemberExpression' &&
          grandParent.type == 'CallExpression' &&
          JEST_MOCK_IMPLEMENTATION[parent.property.name]
        ) {
          p.value.arguments = grandParent.arguments
          j(p.parent.parent).replaceWith(p.value)
        }
      })
      .size()
  }

  updateAPIs(JEST_API)
  updateMockFns()

  return mutations ? root.toSource(printOptions) : null
}
