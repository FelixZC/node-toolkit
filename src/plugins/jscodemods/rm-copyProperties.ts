module.exports = (file, api, options) => {
  if (!options.filters) {
    options.filters = []
  }

  const j = api.jscodeshift

  const getRequireCall = (path, moduleName) => {
    const call = path
      .findVariableDeclarators()
      .filter(j.filters.VariableDeclarator.requiresModule(moduleName))
    return call.size() == 1 ? call.get() : null
  }

  const printOptions = options.printOptions || { quote: 'single' }
  const root = j(file.source)

  const flatten = (a) => (Array.isArray(a) ? [].concat(...a.map(flatten)) : a)

  const getObject = (node) => {
    if (
      options.optionsOrConfig &&
      node.type == 'LogicalExpression' &&
      node.operator == '||' &&
      isOptionsOrConfig(node)
    ) {
      return node.left
    }
    return node
  }

  const inlineObjectExpression = (path) =>
    j(path).replaceWith(
      j.objectExpression(
        flatten(
          path.value.arguments
            .map(getObject)
            .map((p) => (p.type == 'ObjectExpression' ? p.properties : j.spreadProperty(p)))
        )
      )
    )

  const isOptionsOrConfig = (node) => {
    if (
      node.type == 'Identifier' &&
      (node.name == 'options' ||
        node.name == 'config' ||
        node.name == 'defaults' ||
        node.name == '_defaults' ||
        node.name == 'defaultOptions' ||
        node.name == '_defaultOptions')
    ) {
      return true
    }

    if (node.type == 'LogicalExpression' && node.operator == '||') {
      return (
        isOptionsOrConfig(node.left) &&
        node.right.type == 'ObjectExpression' &&
        !node.right.properties.length
      )
    }

    return false
  }

  const isStateOrProps = (node) =>
    node.type == 'MemberExpression' &&
    node.object &&
    node.object.type == 'MemberExpression' &&
    node.object.object &&
    node.object.object.type == 'ThisExpression' &&
    node.object.property &&
    node.object.property.type == 'Identifier' &&
    (node.object.property.name == 'state' || node.object.property.name == 'props')

  const checkArguments = (path) =>
    path.value.arguments
      .slice(1)
      .every(
        (argument) =>
          argument.type == 'ObjectExpression' ||
          (options.arbiterMixin &&
            argument.type == 'Identifier' &&
            argument.name == 'ArbiterMixin') ||
          (options.optionsOrConfig && isOptionsOrConfig(argument)) ||
          (options.inlineStateAndProps && isStateOrProps(argument))
      )

  const availableFilters = {
    onlyPrototypeAssignments(path) {
      var node = path.value.arguments[0]
      return (
        node.type == 'MemberExpression' &&
        node.object.type == 'Identifier' &&
        node.property.type == 'Identifier' &&
        node.property.name == 'prototype'
      )
    },
    onlyThisExpressions(path) {
      return path.value.arguments[0].type == 'ThisExpression'
    },
    onlyNewExpressions(path) {
      return path.value.arguments[0].type == 'NewExpression'
    },
    onlyCapitalizedIdentifiers(path) {
      var node = path.value.arguments[0]
      return node.type == 'Identifier' && node.name.charAt(0) == node.name.charAt(0).toUpperCase()
    },
    onlyCallExpressions(path) {
      var node = path.parent.value
      return node.type == 'ExpressionStatement'
    },
    onlyObjectExpressions(path) {
      return path.value.arguments[0].type == 'ObjectExpression'
    },
    onlyDefaults(path) {
      var node = path.value.arguments[0]
      return node.type == 'Identifier' && node.name == 'defaults'
    }
  }

  const rmCopyPropertyCalls = (path) => {
    if (availableFilters.onlyObjectExpressions(path)) {
      inlineObjectExpression(path)
    } else {
      j(path).replaceWith(
        j.callExpression(
          j.memberExpression(j.identifier('Object'), j.identifier('assign'), false),
          path.value.arguments.map(getObject)
        )
      )
    }
  }

  if (options.inlineStateAndProps) {
    options.filters.push('onlyObjectExpressions')
  }

  const filters = (options.omitArgumentsCheck ? [] : [checkArguments]).concat(
    options.filters.map((filterName) => availableFilters[filterName])
  )

  const declarator = getRequireCall(root, 'copyProperties')
  if (declarator) {
    const variableName = declarator.value.id.name
    const didTransform =
      root
        .find(j.CallExpression, { callee: { name: variableName } })
        .filter((p) => filters.every((filter) => filter(p)))
        .forEach(rmCopyPropertyCalls)
        .size() > 0
    if (didTransform) {
      if (!root.find(j.CallExpression, { callee: { name: variableName } }).size()) {
        j(declarator).remove()
      }
      return root.toSource(printOptions)
    }
  }
  return null
}
