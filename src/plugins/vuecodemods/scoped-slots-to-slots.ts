import type * as N from 'jscodeshift'
import wrap from '../wrap-ast-transformation'
import type { ASTTransformation } from '../wrap-ast-transformation'
export const transformAST: ASTTransformation = ({ j, root }) => {
  const dotScopedSlots = root.find(j.MemberExpression, {
    property: {
      name: '$scopedSlots',
      type: 'Identifier'
    }
  })
  dotScopedSlots.forEach(({ node }) => {
    ;(node.property as N.Identifier).name = '$slots'
  })
  const squareBracketScopedSlots = root.find(j.MemberExpression, {
    property: {
      type: 'StringLiteral',
      value: '$scopedSlots'
    }
  })
  squareBracketScopedSlots.forEach(({ node }) => {
    node.property = j.stringLiteral('$slots')
  })
}
export default wrap(transformAST)
export const parser = 'babylon'
