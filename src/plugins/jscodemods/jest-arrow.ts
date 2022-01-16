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
import { Transform } from 'jscodeshift'

const transformer: Transform = (file, api) => {
  const j = api.jscodeshift
  const functionsToTransform = [
    'afterEach',
    'beforeEach',
    'describe',
    'it',
    'test',
    'xdescribe',
    'xit',
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
      const lastArg = path.node.expression.arguments.length - 1
      const fn = path.node.expression.arguments[lastArg]
      path.node.expression.arguments[lastArg] = j.arrowFunctionExpression(
        fn.params,
        fn.body
      )
    })
    .toSource()
}

export default transformer
