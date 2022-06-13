import { Visitor } from '@babel/core'
import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import generator from '@babel/generator'
import type { NodePath } from '@babel/core'
function test(code: string) {
  // 将代码转抽象语法树
  const ast = parser.parse(code)
  const visitor: Visitor = {
    CallExpression(path) {
      const isConsoleLog =
        t.isMemberExpression(path.node.callee) &&
        t.isIdentifier(path.node.callee.object) &&
        path.node.callee.object.name === 'console' &&
        t.isIdentifier(path.node.callee.property) &&
        path.node.callee.property.name === 'log'
      if (isConsoleLog) {
        const funcPath = path.findParent((p) => {
          return p.isFunctionDeclaration()
        }) as NodePath<t.FunctionDeclaration>
        if (funcPath && funcPath.node.id) {
          const funcName = funcPath.node.id.name
          path.node.arguments.unshift(t.stringLiteral(funcName))
        }
      }
    }
  }

  // traverse 转换代码
  traverse(ast, visitor)
  // 3. generator 将 AST 转回成代码
  return generator(ast, {}, code)
}
const code = `
function getData() {
  console.log('data')
}
`
console.log(test(code).code)
