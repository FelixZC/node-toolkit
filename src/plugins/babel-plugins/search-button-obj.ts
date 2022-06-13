/**
 * 查找項目按钮名称
 */
import { cloneDeep } from 'lodash'
import { declare } from '@babel/helper-plugin-utils'
import { findObjectPropertyWithKey, getGeneratorOption, getParentFunctionName } from './ast-utils' // 返回权限串

import generator from '@babel/generator'
import { NodePath } from '@babel/traverse'
import { strToJson } from '../../utils/common'
import * as t from '@babel/types'
export default declare((babel) => {
  const authorizationString = (
    isTome: boolean,
    tomeAuthorization: string,
    catalogAuthorization: string
  ) => {
    if (isTome) {
      return `AMSTome:${tomeAuthorization}`
    } else {
      return `AMSCatalog:${catalogAuthorization}`
    }
  }

  const extra = {} as Record<string, any>

  const saveBtnCache = (objPath: NodePath<t.ObjectExpression>, functionName: string | number) => {
    const outNode = cloneDeep(objPath.node)
    const menu = findObjectPropertyWithKey(outNode, 'clickHandle')

    if (menu) {
      const authorizationProperty = findObjectPropertyWithKey(outNode, 'authorization')

      if (authorizationProperty) {
        const authorizationPropertyValue = authorizationProperty.value

        if (t.isCallExpression(authorizationPropertyValue)) {
          objPath.traverse({
            MemberExpression(memberPath) {
              const property = memberPath.node.property

              if (t.isIdentifier(property)) {
                if (property.name === 'authorizationString') {
                  const argus = authorizationPropertyValue.arguments
                  const argu0 = argus[0] as t.MemberExpression
                  const argu1 = argus[1] as t.StringLiteral
                  const argu2 = argus[2] as t.StringLiteral
                  const condition1 = authorizationString(true, argu1.value, argu2.value)
                  const condition2 = authorizationString(false, argu1.value, argu2.value)
                  const newNode = t.conditionalExpression(
                    argu0,
                    t.stringLiteral(condition1),
                    t.stringLiteral(condition2)
                  )
                  /** 后期自己在这里进行替换 */
                  // const propertyIndex = outNode.properties.indexOf(authorizationProperty)
                  // outNode.properties[propertyIndex] = t.objectProperty(
                  //   t.identifier('authorization'),
                  //   newNode
                  // )

                  outNode.properties.push(
                    t.objectProperty(t.identifier('authorizationNew'), newNode)
                  )
                  outNode.properties.push(
                    t.objectProperty(t.identifier('authorizationTome'), t.stringLiteral(condition1))
                  )
                  outNode.properties.push(
                    t.objectProperty(
                      t.identifier('authorizationCatalog'),
                      t.stringLiteral(condition2)
                    )
                  )
                  /** 终端遍历 */
                }
              }
            }
          })
        } else if (t.isStringLiteral(authorizationPropertyValue)) {
          outNode.properties.push(
            t.objectProperty(
              t.identifier('authorizationTome'),
              t.stringLiteral(authorizationPropertyValue.value)
            )
          )
          outNode.properties.push(
            t.objectProperty(
              t.identifier('authorizationCatalog'),
              t.stringLiteral(authorizationPropertyValue.value)
            )
          )
        }
      }
      /** 确认数据无误就直接复写结果 */
      // objPath.node = outNode

      const keys = ['name', 'title', 'icon', 'authorizationTome', 'authorizationCatalog']
      outNode.properties = outNode.properties.filter((property) => {
        if (!t.isSpreadElement(property)) {
          const key = (property.key as t.Identifier).name || (property.key as t.StringLiteral).value
          return keys.includes(key)
        }

        return false
      })

      if (!extra[functionName]) {
        extra[functionName] = []
      }

      let code: string

      try {
        code = strToJson(generator(outNode, getGeneratorOption(), '').code)
      } catch {
        code = generator(outNode, getGeneratorOption(), '').code
      }

      extra[functionName].push(code)
    }
  }

  return {
    name: 'ast-transform',

    getExtra() {
      return extra
    },

    visitor: {
      ArrayExpression(arrPath) {
        /** 查找符合按钮组格式的数组 */
        arrPath.traverse({
          ObjectExpression(objPath) {
            if (
              (findObjectPropertyWithKey(objPath.node, 'name') &&
                findObjectPropertyWithKey(objPath.node, 'icon')) ||
              findObjectPropertyWithKey(objPath.node, 'clickHandle')
            ) {
              const { functionName, parentFunctionPath } = getParentFunctionName(arrPath)

              if (parentFunctionPath) {
                saveBtnCache(objPath, functionName)
              }
            }
          }
        })
      }
    }
  }
})
