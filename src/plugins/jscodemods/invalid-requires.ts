module.exports = function (file, api, options) {
  const jscodeshift = api.jscodeshift
  const printOptions = options.printOptions || { quote: 'single' }
  const requireStatements = new Set()

  const root = jscodeshift(file.source)
    .find(jscodeshift.CallExpression, { callee: { name: 'require' } })
    .filter(
      (requireStatement) =>
        requireStatement.parent.value.type == 'VariableDeclarator' &&
        requireStatement.parent.parent.value.declarations.length != 1
    )
    .forEach((requireStatement) => {
      requireStatements.add(requireStatement.parent.parent)
    })

  requireStatements.forEach((requireStatement) => {
    jscodeshift(requireStatement).replaceWith(
      requireStatement.value.declarations.map((declaration, i) => {
        const kind = requireStatement.value.kind // e.g. var or const
        const variableDeclaration = jscodeshift.variableDeclaration(kind, [declaration])

        if (i == 0) {
          variableDeclaration.comments = requireStatement.value.comments
        } else if (declaration.comments) {
          variableDeclaration.comments = declaration.comments
          declaration.comments = null
        }

        return variableDeclaration
      })
    )
  })

  return requireStatements.size ? root.toSource(printOptions) : null
}
