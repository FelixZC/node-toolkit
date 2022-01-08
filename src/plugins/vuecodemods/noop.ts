// this file is served as a boilerplate template for writing more complex transformations
import wrap from '../wrapAstTransformation'
import type { ASTTransformation } from '../wrapAstTransformation'

export const transformAST: ASTTransformation = (context) => {}

export default wrap(transformAST)
export const parser = 'babylon'
