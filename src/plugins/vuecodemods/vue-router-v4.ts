import type { ObjectExpression } from 'jscodeshift'
import { transformAST as addImport } from './add-import'
import { transformAST as removeExtraneousImport } from './remove-extraneous-import' // new Router() -> createRouter()

import wrap from '../wrapAstTransformation'
import type { ASTTransformation } from '../wrapAstTransformation'

export const transformAST: ASTTransformation = (context) => {
  const { j, root } = context
  const routerImportDecls = root.find(j.ImportDeclaration, {
    source: {
      value: 'vue-router'
    }
  })
  const importedVueRouter = routerImportDecls.find(j.ImportDefaultSpecifier)

  if (importedVueRouter.length) {
    const localVueRouter = importedVueRouter.get(0).node.local.name
    const newVueRouter = root.find(j.NewExpression, {
      callee: {
        name: localVueRouter,
        type: 'Identifier'
      }
    })
    addImport(context, {
      source: 'vue-router',
      specifier: {
        imported: 'createRouter',
        type: 'named'
      }
    })
    newVueRouter.replaceWith(({ node }) => {
      // mode: 'history' -> history: createWebHistory(), etc
      let historyMode = 'createWebHashHistory'
      let baseValue

      if (!j.ObjectExpression.check(node.arguments[0])) {
        throw new Error(
          'Currently, only object expressions passed to `new VueRouter` can be transformed.'
        )
      }

      const routerConfig: ObjectExpression = node.arguments[0]
      routerConfig.properties = routerConfig.properties.filter((p) => {
        if (!j.ObjectProperty.check(p) && !j.Property.check(p)) {
          return true
        }

        if ((p.key as any).name === 'mode') {
          const mode = (p.value as any).value

          if (mode === 'hash') {
            historyMode = 'createWebHashHistory'
          } else if (mode === 'history') {
            historyMode = 'createWebHistory'
          } else if (mode === 'abstract') {
            historyMode = 'createMemoryHistory'
          } else {
            throw new Error(`mode must be one of 'hash', 'history', or 'abstract'`)
          }

          return false
        }
        if ((p.key as any).name === 'base') {
          baseValue = p.value
          return false
        }

        return true
      }) // add the default mode with a hash history

      addImport(context, {
        source: 'vue-router',
        specifier: {
          imported: historyMode,
          type: 'named'
        }
      })
      node.arguments[0].properties = node.arguments[0].properties.filter((p) => !!p)
      node.arguments[0].properties.unshift(
        j.objectProperty(
          j.identifier('history'),
          j.callExpression(j.identifier(historyMode), baseValue ? [baseValue] : [])
        )
      )
      return j.callExpression(j.identifier('createRouter'), node.arguments)
    })
    removeExtraneousImport(context, {
      localBinding: localVueRouter
    })
  }
}
export default wrap(transformAST)
export const parser = 'babylon'
