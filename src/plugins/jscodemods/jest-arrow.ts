/**
 * Transforms all the normal functions into arrow functions as callback of
 * jest globals such as describe, it...
 *
 * describe(function() {
 *   it('should work', function() {
 *     ...
 *   });
 * });
 *
 * -->
 *
 * describe(() => {
 *   it('should work', () => {
 *     ...
 *   });
 * });
 */

export default function transformer(file, api) {
  const j = api.jscodeshift

  const functionsToTransform = [
    'describe',
    'beforeEach',
    'afterEach',
    'it',
    'xit',
    'test',
    'xdescribe'
  ]

  return j(file.source)
    .find(j.ExpressionStatement)
    .filter((path) => {
      return (
        path.node.expression.type === 'CallExpression' &&
        path.node.expression.callee.type === 'Identifier' &&
        functionsToTransform.indexOf(path.node.expression.callee.name) !== -1
      )
    })
    .forEach((path) => {
      var lastArg = path.node.expression.arguments.length - 1
      var fn = path.node.expression.arguments[lastArg]

      path.node.expression.arguments[lastArg] = j.arrowFunctionExpression(fn.params, fn.body)
    })
    .toSource()
}
