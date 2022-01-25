import type { ArrowFunctionExpression } from 'jscodeshift'
import { transformAST as addImport } from './add-import'
import wrap from '../wrapAstTransformation'
import type { ASTTransformation } from '../wrapAstTransformation'

export const transformAST: ASTTransformation = (context) => {
  const { j, root } = context
  const renderFns = root.find(j.ObjectProperty, {
    key: {
      name: 'render'
    },
    value: {
      type: 'ArrowFunctionExpression'
    }
  })
  const renderMethods = root.find(j.ObjectMethod, {
    key: {
      name: 'render'
    },
    params: (params: Array<any>) => j.Identifier.check(params[0]) && params[0].name === 'h'
  })

  if (renderFns.length || renderMethods.length) {
    addImport(context, {
      source: 'vue',
      specifier: {
        imported: 'h',
        type: 'named'
      }
    })
    renderFns.forEach(({ node }) => {
      ;(node.value as ArrowFunctionExpression).params.shift()
    })
    renderMethods.forEach(({ node }) => {
      node.params.shift()
    })
  }
}
export default wrap(transformAST)
export const parser = 'babylon'
