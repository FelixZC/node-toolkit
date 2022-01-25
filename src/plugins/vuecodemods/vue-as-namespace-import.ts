import wrap from '../wrapAstTransformation' // import Vue from 'vue' -> import * as Vue from 'vue'

import type { ASTTransformation } from '../wrapAstTransformation'

export const transformAST: ASTTransformation = ({ j, root }) => {
  const importDecl = root.find(j.ImportDeclaration, {
    source: {
      value: 'vue'
    }
  })
  importDecl.find(j.ImportDefaultSpecifier).replaceWith(({ node }) => {
    return j.importNamespaceSpecifier(node.local)
  })
}
export default wrap(transformAST)
export const parser = 'babylon'
