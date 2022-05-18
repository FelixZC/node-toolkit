import { NodePath } from '@babel/core'
import * as parser from '@babel/parser'
import * as t from '@babel/types'

interface SpecifierInfo {
  source: string
  type: 'ImportSpecifier' | 'ImportNamespaceSpecifier' | 'ImportDefaultSpecifier'
  localName: string
  importedName?: string
  importKind?: 'type' | 'typeof' | 'value' | null
}
export type ImportInfo = Array<SpecifierInfo>
/**
 * 获取导入信息
 */
export const getImportInfo = (item: t.ImportDeclaration) => {
  const importInfo: ImportInfo = []

  for (const specifier of item.specifiers) {
    const specifierInfo: SpecifierInfo = {
      source: '',
      type: 'ImportSpecifier',
      localName: ''
    }
    if (t.isImportDefaultSpecifier(specifier)) {
      specifierInfo.type = 'ImportDefaultSpecifier'
    }
    if (t.isImportSpecifier(specifier)) {
      specifierInfo.type = 'ImportSpecifier'
      if (t.isIdentifier(specifier.imported)) {
        specifierInfo.importedName = specifier.imported.name
      } else {
        specifierInfo.importedName = specifier.imported.value
      }
    }
    if (t.isImportNamespaceSpecifier(specifier)) {
      specifierInfo.type = 'ImportNamespaceSpecifier'
    }
    specifierInfo.localName = specifier.local.name
    specifierInfo.source = item.source.value
    if (item.importKind) {
      specifierInfo.importKind = item.importKind
    }
    importInfo.push(specifierInfo)
  }
  return importInfo
}

/**
 * 查找包含指定对象属性名的对象属性
 * @param target
 * @param key
 * @returns
 */

export const findObjectPropertyWithKey = (target: t.ObjectExpression, key: string) => {
  if (!key) {
    return null
  }

  const result = target.properties.find((item) => {
    if (t.isObjectProperty(item) || t.isObjectMethod(item)) {
      const taget = (item.key as t.Identifier).name || (item.key as t.StringLiteral).value
      return taget === key
    }

    return false
  })
  return result as t.ObjectProperty
}
/**
 * 添加新属性
 * @param elements
 * @param input
 * @returns
 */

export const addObjectNewProperty = (
  element: t.ObjectExpression,
  input: Record<string, any> | string
) => {
  let newObjectExpression = createObjectTemplateNode(input)
  element.properties = [...element.properties, ...newObjectExpression.properties]
  return element
}
/**
 * 添加新对象
 * @param elements
 * @param input
 */

export const addNewObject = (
  elements: t.ObjectExpression[],
  input: Record<string, any> | string
) => {
  let newObjectExpression = createObjectTemplateNode(input)
  elements.push(newObjectExpression)
  return elements
}
/**
 * 对象数组过滤相同属性对象
 * @param elements
 * @param key
 * @returns
 */

export const filterSameObject = (elements: t.ObjectExpression[], key = 'prop') => {
  const cache: Record<string, any> = {}
  const samePropItems: t.ObjectExpression[] = []

  for (const item of elements) {
    const target = findObjectPropertyWithKey(item, key)

    if (target) {
      const key = (target.key as t.Identifier).name || (target.key as t.StringLiteral).value
      const value = (target.value as t.StringLiteral).value

      if (key && value) {
        //移除重复key值旧对象
        if (Reflect.has(cache, key + value)) {
          samePropItems.push(cache[key + value])
        }

        cache[key + value] = item
      }
    }
  }
  /** 移除相同prop的数组 */

  for (const item of samePropItems) {
    elements.splice(elements.indexOf(item), 1)
  }

  return elements
}
/**  //过滤对象相同属性 */

export const filterSameProperty = (element: t.ObjectExpression) => {
  const cache: Record<string, any> = {}
  const sameProperty: (t.ObjectMethod | t.ObjectProperty | t.SpreadElement)[] = []

  for (const property of element.properties) {
    if (t.isObjectProperty(property)) {
      const key = (property.key as t.Identifier).name || (property.key as t.StringLiteral).value
      /** 移除旧属性值 */

      if (Reflect.has(cache, key)) {
        sameProperty.push(cache[key])
      }

      cache[key] = property
    }
  }
  /** 移除相同prop的数组 */

  for (const property of sameProperty) {
    element.properties.splice(element.properties.indexOf(property), 1)
  }

  return element
}
/**
 * 查询方法定义位置
 * @param path
 * @returns
 */

export const getFunctionName = (path: NodePath<t.Function>) => {
  let result: string | number = ''

  if (t.isArrowFunctionExpression(path.node)) {
    const definedNodePath = path.findParent((path) => t.isVariableDeclarator(path.node))
    definedNodePath &&
      (result = ((definedNodePath.node as t.VariableDeclarator).id as t.Identifier).name)
  } else if (
    t.isClassMethod(path.node) ||
    t.isClassPrivateMethod(path.node) ||
    t.isObjectMethod(path.node)
  ) {
    switch (path.node.key.type) {
      case 'Identifier':
        result = path.node.key.name
        break

      case 'NumericLiteral':
      case 'StringLiteral':
        result = path.node.key.value
        break
    }
  } else {
    result = path.node.id!.name
  }

  return result
}
/**
 * 获取节点方法名
 * @param path
 * @returns
 */

export const getParentFunctionName = (startPath: NodePath) => {
  let functionName: string | number = ''
  let parentFunctionPath = startPath.getFunctionParent()
  /**持续向上查找，直到不再存在方法体 */

  while (!functionName) {
    if (parentFunctionPath) {
      functionName = getFunctionName(parentFunctionPath)
      !functionName && (parentFunctionPath = parentFunctionPath.getFunctionParent())
    } else {
      functionName = 'none' //中断执行
    }
  }

  return {
    functionName,
    parentFunctionPath
  }
}
/**
 * 匹配对象表达式
 * @param target
 * @param key
 * @param value
 */

export const matchObjectExpress = (
  elements: t.ObjectExpression[],
  key = 'label',
  value: string
) => {
  return elements.findIndex((element) => {
    let labelObjectProperty = findObjectPropertyWithKey(element, key)
    return (
      labelObjectProperty &&
      t.isLiteral(labelObjectProperty.value) &&
      value === (labelObjectProperty.value as t.StringLiteral)?.value
    )
  })
}
/**
 * 创造模板节点
 * @param defaultOption
 * @returns
 */

export const createObjectTemplateNode = (input: Record<string, any> | string) => {
  let newObjectExpression: t.ObjectExpression

  if (typeof input === 'string') {
    let astCode = parser.parseExpression(input)

    if (t.isObjectExpression(astCode)) {
      newObjectExpression = astCode
    } else {
      throw new Error('createObjectTemplateNode提供input格式错误')
    }
  } else {
    newObjectExpression = t.objectExpression(
      Object.entries(input).map(([key, value]) => {
        let valueNode: t.Expression

        switch (typeof value) {
          case 'boolean':
            valueNode = t.booleanLiteral(value)
            break

          case 'string':
            valueNode = t.stringLiteral(value)
            break

          case 'number':
            valueNode = t.numericLiteral(value)
            break

          default:
            valueNode = t.nullLiteral()
        }

        return t.objectProperty(t.identifier(key), valueNode)
      })
    )
  }

  return newObjectExpression
}
/**
 * 新增对象属性值
 * @param elements
 * @param key
 * @param value
 * @param newProperty
 * @returns
 */

export const replaceExpressionProperty = (
  elements: t.ObjectExpression[],
  key: string = 'prop',
  value: string,
  newProperty: string | Record<string, any>
) => {
  const matchObjIndex = matchObjectExpress(elements, key, value)

  if (matchObjIndex > -1) {
    elements[matchObjIndex] = addObjectNewProperty(elements[matchObjIndex], newProperty)
  }

  return elements
}
