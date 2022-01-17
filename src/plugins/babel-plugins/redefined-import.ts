import { declare } from '@babel/helper-plugin-utils'
import { upperFirstletter } from '../../utils/common'
import { getImportObj } from './ast-utils'
import { NodePath } from '@babel/core'
import type { ImportDeclaration, MemberExpression, Statement, ThisExpression } from '@babel/types'
import type { ImportObj } from './ast-utils'
interface Redefined {
  defaultImportName: string
  importNameList: string[]
  source: string
}
const redefinedList: Redefined[] = [
  {
    defaultImportName: 'PublicMethod',
    importNameList: [],
    source: '@/utils/PublicMethod.js'
  }
]

const findParentMemberExpression = (p: NodePath<ThisExpression | MemberExpression>) => {
  if (!p) {
    return
  }

  const target = p.findParent((path) => path.isMemberExpression())
  return target as NodePath<MemberExpression>
}

export default declare((babel) => {
  const { types: t } = babel
  const buildRequire = babel.template(`
  import IMPORT_NAME from 'SOURCE'
`)
  let refImportNameList: string[] = []
  let oldImportList: ImportObj[] = []
  return {
    name: 'ast-transform',
    // not required
    visitor: {
      Program: {
        enter(path) {
          const importList = path.node.body.filter(
            (i) => i.type === 'ImportDeclaration'
          ) as ImportDeclaration[]
          oldImportList = getImportObj(importList)
        },

        exit(path) {
          const oldDefaultImportNameList = oldImportList.map((item) => item.defaultImportName)
          const newDefaultImportNameList: Statement[] = []

          for (const name of refImportNameList) {
            if (!oldDefaultImportNameList.includes(name)) {
              const redefiend = redefinedList.find((item) => item.defaultImportName === name)

              if (redefiend) {
                let newImport = buildRequire({
                  IMPORT_NAME: t.identifier(`${upperFirstletter(name)}`),
                  SOURCE: redefiend.source
                })

                if (!Array.isArray(newImport)) {
                  newImport = [newImport]
                }

                newDefaultImportNameList.concat(...newImport)
              }
            }
          }

          path.node.body = newDefaultImportNameList.concat(path.node.body)
          refImportNameList = []
          oldImportList = []
        }
      },

      ThisExpression(p) {
        const target = findParentMemberExpression(p)

        if (target) {
          const trueTarget = findParentMemberExpression(target)

          if (
            trueTarget &&
            trueTarget.node.property.type === 'Identifier' &&
            target.node.property.type === 'Identifier' &&
            target.node.property.name &&
            target.node.property.name.startsWith('$')
          ) {
            const reference = target.node.property.name.slice(1)

            if (redefinedList.some((i) => i.defaultImportName === reference)) {
              !refImportNameList.includes(reference) && refImportNameList.push(reference)

              if (trueTarget.node.property.name) {
                trueTarget.replaceWith(
                  t.memberExpression(
                    t.identifier(upperFirstletter(reference)),
                    t.identifier(trueTarget.node.property.name)
                  )
                )
              } else {
                trueTarget.node.object = t.identifier(upperFirstletter(reference))
              }
            }
          }
        }
      }
    }
  }
})
