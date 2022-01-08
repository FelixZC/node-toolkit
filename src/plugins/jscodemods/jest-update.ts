const path = require('path')

module.exports = function (file, api, options = {}) {
  if (
    !file.path.includes(path.sep + '__tests__' + path.sep) &&
    !file.path.includes(path.sep + '__mocks__' + path.sep)
  ) {
    return null
  }

  if (!file.source.includes('mock-modules') && !file.source.includes('mocks')) {
    return null
  }

  const j = api.jscodeshift
  const printOptions = options.printOptions || { quote: 'single' }
  const root = j(file.source)
  let mutations = 0

  const getRequireCall = (path, moduleName) => {
    const call = path
      .findVariableDeclarators()
      .filter(j.filters.VariableDeclarator.requiresModule(moduleName))
    return call.size() == 1 ? call.get() : null
  }

  const MOCK_MODULES_API = {
    dontMock: 'dontMock',
    setMock: 'setMock',
    mock: 'mock',
    autoMockOff: 'autoMockOff',
    autoMockOn: 'autoMockOn',
    dumpCache: 'resetModuleRegistry',
    generateMock: 'genMockFromModule'
  }

  const MOCKS_API = {
    getMockFunction: 'genMockFn',
    getMockFn: 'genMockFn'
  }

  const moduleMatcher = (moduleName) => (node) =>
    node.name == 'mockModules' ||
    node.name == 'MockModules' ||
    node.name == 'modules' ||
    node.name == 'mocks' ||
    (node.type == 'CallExpression' &&
      node.callee.type == 'Identifier' &&
      node.callee.name == 'require' &&
      node.arguments.length == 1 &&
      node.arguments[0].value == moduleName)

  const updateAPIs = (matcher, apiMethods) =>
    (mutations += root
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: matcher,
          property: {
            name: (name) => apiMethods[name]
          }
        }
      })
      .replaceWith((p) => {
        const name = p.value.callee.property.name
        if (apiMethods[name] == name) {
          // short-circuit to keep code style in-tact
          p.value.callee.object = j.identifier('jest')
          return p.value
        }

        return j.callExpression(
          j.memberExpression(j.identifier('jest'), j.identifier(apiMethods[name]), false),
          p.value.arguments
        )
      })
      .size())

  const removeRequireCall = (name) => {
    const declarator = getRequireCall(root, name)
    if (declarator) {
      const hasMockModulesIdentifier =
        root.find(j.Identifier, { name: declarator.value.id.name }).size() > 1
      if (!hasMockModulesIdentifier) {
        j(declarator).remove()
        mutations++
      }
    }

    mutations += root
      .find(j.CallExpression, {
        callee: {
          name: 'require'
        },
        arguments: [{ value: name }]
      })
      .filter((p) => p.parent.value.type == 'ExpressionStatement')
      .remove()
      .size()
  }

  const firstNode = () => root.find(j.Program).get('body', 0)
  const comment = firstNode().node.leadingComments
  updateAPIs(moduleMatcher('mock-modules'), MOCK_MODULES_API)
  updateAPIs(moduleMatcher('mocks'), MOCKS_API)
  removeRequireCall('mock-modules')
  removeRequireCall('mocks')
  firstNode().node.comments = comment

  return mutations ? root.toSource(printOptions) : null
}
