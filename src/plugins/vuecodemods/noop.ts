/** this file is served as a boilerplate template for writing more complex transformations */
import wrap from '../wrap-ast-transformation'
import type { ASTTransformation } from '../wrap-ast-transformation'
export const transformAST: ASTTransformation = (context) => {}
export default wrap(transformAST)
export const parser = 'babylon'
