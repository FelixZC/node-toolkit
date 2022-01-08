'use strict'

module.exports = function transformer(file, api) {
  const j = api.jscodeshift
  const statement = j.template.statement

  const FUNCTION_TYPES = [j.FunctionDeclaration, j.ArrowFunctionExpression, j.FunctionExpression]

  let updated = false

  function getNewName(paramName) {
    const firstChar = paramName.charAt(0)
    const isUpperCase = paramName.charAt(0).toUpperCase() === firstChar

    if (isUpperCase) {
      return `Local${paramName}`
    } else {
      const upperCase = paramName.charAt(0).toUpperCase() + paramName.slice(1)
      return `local${upperCase}`
    }
  }

  function getLocalVarStatement(paramName, newName) {
    const localVar = statement`let ${j.identifier(newName)} = ${paramName};\n`
    return localVar
  }

  function definedInParentScope(identifierName, scope) {
    let localScope = scope
    while (localScope) {
      if (localScope.declares(identifierName)) {
        return true
      }
      localScope = localScope.parent
    }

    return false
  }

  function getParamNames(params) {
    return [].concat(
      ...params.map((param) => {
        if (param === null) {
          return null
        } else if (param.type === 'Identifier') {
          return param.name
        } else if (param.type === 'ObjectPattern') {
          return param.properties.map((property) => {
            if (j.Property.check(property)) {
              return property.value.name
            } else if (j.SpreadProperty.check(property) || j.RestProperty.check(property)) {
              return property.argument.name
            } else {
              throw new Error(`Unexpected Property Type ${property.type} ${j(property).toSource()}`)
            }
          })
        } else if (param.type === 'RestElement') {
          return param.argument.name
        } else if (j.AssignmentPattern.check(param)) {
          return param.left.name
        } else if (j.ArrayPattern.check(param)) {
          return [].concat(...getParamNames(param.elements))
        } else {
          throw new Error(`Unexpected Param Type ${param.type} ${j(param).toSource()}`)
        }
      })
    )
  }

  function updateFunction(func) {
    const params = func.get('params')

    const functionScope = func.scope

    const newBindings = new Set()

    const paramNames = getParamNames(params.value)

    const reassignedParamNames = paramNames.filter((paramName) => {
      const numAssignments = j(func)
        .find(j.AssignmentExpression)
        .filter((assignment) => {
          const left = assignment.node.left

          // old = 4;
          if (j.Identifier.check(left)) {
            return left.name === paramName
          } else if (j.ObjectPattern.check(left)) {
            return left.properties.some((property) => {
              if (j.Property.check(property)) {
                return property.key.name === paramName
              } else if (j.RestProperty.check(property)) {
                return property.argument.name === paramName
              } else {
                throw new Error(
                  `Unexpected Property Type ${property.type} ${j(property).toSource()}`
                )
              }
            })
          }

          return false
        }).length

      const numUpdated = j(func).find(j.UpdateExpression, {
        argument: {
          name: paramName
        }
      }).length

      return numAssignments > 0 || numUpdated > 0
    })

    if (reassignedParamNames.length === 0) {
      return
    }

    reassignedParamNames.forEach((paramName) => {
      const oldName = paramName
      const newName = getNewName(paramName)
      const localVar = getLocalVarStatement(paramName, newName)

      if (definedInParentScope(newName, func.scope)) {
        return
      }

      j(func.get('body'))
        .find(j.Identifier, { name: paramName })
        .forEach((identifier) => {
          const parent = identifier.parent.node

          if (
            j.MemberExpression.check(parent) &&
            parent.property === identifier.node &&
            !parent.computed
          ) {
            // obj.oldName
            return
          }

          if (j.Property.check(parent) && parent.key === identifier.node && !parent.computed) {
            // { oldName: 3 }

            const closestAssignment = j(identifier).closest(j.AssignmentExpression)
            const assignmentHasProperty =
              closestAssignment.filter((assignment) => {
                return (
                  j.ObjectPattern.check(assignment.node.left) &&
                  assignment.node.left.properties.includes(parent)
                )
              }).length > 0

            if (!assignmentHasProperty) {
              // ({oldName} = x);
              return
            }
          }

          if (
            j.MethodDefinition.check(parent) &&
            parent.key === identifier.node &&
            !parent.computed
          ) {
            // class A { oldName() {} }
            return
          }

          if (j.JSXAttribute.check(parent)) {
            // <Foo oldName={oldName} />
            return
          }

          let scope = identifier.scope

          if (scope === functionScope) {
            const bindings = scope.getBindings()[oldName]
            if (bindings) {
              const recentBinding = bindings[bindings.length - 1]
              if (recentBinding.name === 'id') {
                return
              }
            }
          } else {
            while (scope !== functionScope) {
              if (scope.declares(oldName)) {
                return
              }

              scope = scope.parent
            }
          }

          if (scope) {
            newBindings.add(localVar)

            // ObjectPattern
            if (identifier.parent && j.Property.check(identifier.parent.node)) {
              const property = identifier.parent
              property.shorthand = false
              property.get('shorthand').replace(false)
              property.get('value').get('name').replace(newName)
            } else {
              identifier.get('name').replace(newName)
            }
          }
        })
    })

    const newBindingStatements = Array.from(newBindings).reverse()
    newBindingStatements.forEach((binding) => {
      updated = true
      functionScope.node.body.body.unshift(binding)
    })
  }

  // Facebook has generated files with an annotation. We don't want to modify these.
  // Instead, we should modify the code that generates the files.
  // eslint-disable-next-line no-useless-concat
  if (file.source.includes('@' + 'generated')) {
    return null
  }

  const root = j(file.source)

  FUNCTION_TYPES.forEach((type) => {
    root.find(type).forEach(updateFunction)
  })

  if (updated) {
    return root.toSource({ quote: 'single' })
  }

  return null
}
