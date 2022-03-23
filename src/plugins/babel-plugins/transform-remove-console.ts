import { declare } from '@babel/helper-plugin-utils'
import type { MemberExpression, Expression, PrivateName } from '@babel/types'
import type { NodePath } from '@babel/traverse'
export default declare((babel) => {
  const { types: t } = babel

  function isGlobalConsoleId(id: NodePath) {
    const name = 'console'
    return (
      id.isIdentifier({
        name
      }) &&
      !id.scope.getBinding(name) &&
      id.scope.hasGlobal(name)
    )
  }

  function isExcluded(property: NodePath<PrivateName | Expression>, excludeArray: string[] = []) {
    return (
      excludeArray &&
      excludeArray.some((name) =>
        property.isIdentifier({
          name
        })
      )
    )
  }

  function isIncludedConsole(memberExpr: NodePath<MemberExpression>, excludeArray: string[] = []) {
    const object = memberExpr.get('object')
    const property = memberExpr.get('property')
    if (isExcluded(property, excludeArray)) return false
    if (isGlobalConsoleId(object)) return true
    return (
      //@ts-ignore
      isGlobalConsoleId(object.get('object')) &&
      (property.isIdentifier({
        name: 'call'
      }) ||
        property.isIdentifier({
          name: 'apply'
        }))
    )
  }

  function isIncludedConsoleBind(
    memberExpr: NodePath<MemberExpression>,
    excludeArray: string[] = []
  ) {
    const object = memberExpr.get('object')
    if (!object.isMemberExpression()) return false
    if (isExcluded(object.get('property'), excludeArray)) return false
    return (
      isGlobalConsoleId(object.get('object')) &&
      memberExpr.get('property').isIdentifier({
        name: 'bind'
      })
    )
  }

  function createNoop() {
    return t.functionExpression(null, [], t.blockStatement([]))
  }

  function createVoid0() {
    return t.unaryExpression('void', t.numericLiteral(0))
  }
  return {
    name: 'transform-remove-console',
    visitor: {
      CallExpression(path, state) {
        const callee = path.get('callee')
        if (!callee.isMemberExpression()) return

        if (isIncludedConsole(callee, (state?.opts as Record<string, any>)?.exclude)) {
          if (path.parentPath.isExpressionStatement()) {
            path.remove()
          } else {
            path.replaceWith(createVoid0())
          }
        } else if (isIncludedConsoleBind(callee, (state?.opts as Record<string, any>)?.exclude)) {
          // console.log.bind()
          path.replaceWith(createNoop())
        }
      },

      MemberExpression: {
        exit(path, state) {
          if (
            isIncludedConsole(path, (state?.opts as Record<string, any>)?.exclude) &&
            !path.parentPath.isMemberExpression()
          ) {
            if (path.parentPath.isAssignmentExpression() && path.parentKey === 'left') {
              path.parentPath.get('right').replaceWith(createNoop())
            } else {
              path.replaceWith(createNoop())
            }
          }
        }
      }
    }
  }
})
