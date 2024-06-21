import { NodePath } from '@babel/core'
import * as parser from '@babel/parser'
import * as t from '@babel/types'
import type { GeneratorOptions, ParserOptions } from '@babel/core'

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
 * @param item 一个导入声明节点
 * @returns 返回一个包含导入信息的数组
 */
export const getImportInfo = (item: t.ImportDeclaration) => {
  const importInfo: ImportInfo = []
  for (const specifier of item.specifiers) {
    const specifierInfo: SpecifierInfo = {
      source: '',
      type: 'ImportSpecifier',
      localName: ''
    }

    // 处理默认导入
    if (t.isImportDefaultSpecifier(specifier)) {
      specifierInfo.type = 'ImportDefaultSpecifier'
    }

    // 处理命名导入
    if (t.isImportSpecifier(specifier)) {
      specifierInfo.type = 'ImportSpecifier'

      // 确定导入的名称
      if (t.isIdentifier(specifier.imported)) {
        specifierInfo.importedName = specifier.imported.name
      } else {
        specifierInfo.importedName = specifier.imported.value
      }
    }

    // 处理命名空间导入
    if (t.isImportNamespaceSpecifier(specifier)) {
      specifierInfo.type = 'ImportNamespaceSpecifier'
    }

    // 获取本地名称和源文件信息
    specifierInfo.localName = specifier.local.name
    specifierInfo.source = item.source.value

    // 如果存在导入类型，添加到信息中
    if (item.importKind) {
      specifierInfo.importKind = item.importKind
    }
    importInfo.push(specifierInfo)
  }
  return importInfo
}
/**
 * 查找包含指定对象属性名的对象属性
 * @param target 目标对象表达式节点
 * @param key 要查找的属性名
 * @returns 返回匹配的属性节点，如果没有找到则返回null
 */
export const findObjectPropertyWithKey = (target: t.ObjectExpression, key: string) => {
  if (!key) {
    return null
  }

  // 在对象属性中查找匹配的项
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
 * 添加新属性到对象表达式中
 * @param element 目标对象表达式节点
 * @param input 新属性的信息，可以是一个对象或字符串
 * @returns 返回更新后的对象表达式节点
 */
export const addObjectNewProperty = (
  element: t.ObjectExpression,
  input: Record<string, any> | string
) => {
  // 创建一个新的对象模板节点来包含输入的属性
  let newObjectExpression = createObjectTemplateNode(input)
  // 合并新旧属性
  element.properties = [...element.properties, ...newObjectExpression.properties]
  return element
}
/**
 * 添加新对象到元素数组中
 * @param elements 已有的对象表达式数组
 * @param input 新的对象或字符串，将被转换为对象表达式并添加到数组中
 * @returns 更新后的对象表达式数组
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
 * 过滤掉元素数组中具有相同属性的对象
 * @param elements 对象表达式数组
 * @param key 用于比较的对象属性键，默认为'prop'
 * @returns 过滤后的对象表达式数组，不包含具有重复属性键的对象
 */
export const filterSameObject = (elements: t.ObjectExpression[], key = 'prop') => {
  const cache: Record<string, any> = {}
  const samePropItems: t.ObjectExpression[] = []

  // 遍历元素数组，寻找具有相同键值的对象
  for (const item of elements) {
    const target = findObjectPropertyWithKey(item, key)
    if (target) {
      const key = (target.key as t.Identifier).name || (target.key as t.StringLiteral).value
      const value = (target.value as t.StringLiteral).value

      // 如果发现重复键值，则将旧对象加入待移除列表
      if (key && value) {
        if (Reflect.has(cache, key + value)) {
          samePropItems.push(cache[key + value])
        }
        cache[key + value] = item
      }
    }
  }

  // 移除具有重复键值的旧对象
  for (const item of samePropItems) {
    elements.splice(elements.indexOf(item), 1)
  }
  return elements
}

/**
 * 过滤掉对象中具有相同属性的属性项
 * @param element 对象表达式，其属性将被检查和过滤
 * @returns 过滤后的对象表达式，不包含具有重复属性键的属性项
 */
export const filterSameProperty = (element: t.ObjectExpression) => {
  const cache: Record<string, any> = {}
  const sameProperty: (t.ObjectMethod | t.ObjectProperty | t.SpreadElement)[] = []

  // 遍历对象属性，寻找具有相同键值的属性
  for (const property of element.properties) {
    if (t.isObjectProperty(property)) {
      const key = (property.key as t.Identifier).name || (property.key as t.StringLiteral).value

      // 如果发现重复键值，则将旧属性加入待移除列表
      if (Reflect.has(cache, key)) {
        sameProperty.push(cache[key])
      }
      cache[key] = property
    }
  }

  // 移除具有重复键值的旧属性
  for (const property of sameProperty) {
    element.properties.splice(element.properties.indexOf(property), 1)
  }
  return element
}

/**
 * 获取函数的名称
 * @param path 函数节点的路径信息
 * @returns 函数的名称，如果无法确定则返回空字符串
 */
export const getFunctionName = (path: NodePath<t.Function>) => {
  let result: string | number = ''

  // 根据函数类型的不同，确定函数名称来源
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
        result = path.node.key.value
        break
      case 'StringLiteral':
        result = path.node.key.value
        break
    }
  } else {
    result = path.node.id?.name || ''
  }
  return result
}

/**
 * 获取节点方法名
 * @param startPath 起始节点路径
 * @returns 返回包含函数名和父函数路径的对象
 */
export const getParentFunctionName = (startPath: NodePath) => {
  let functionName: string | number = ''
  let parentFunctionPath = startPath.getFunctionParent()

  // 持续向上查找，直到找到方法名或到达根节点
  while (!functionName) {
    if (parentFunctionPath) {
      functionName = getFunctionName(parentFunctionPath)
      // 如果当前路径不是函数体，则继续向上查找
      !functionName && (parentFunctionPath = parentFunctionPath.getFunctionParent())
    } else {
      // 如果没有找到函数体，则设置函数名为'none'并结束查找
      functionName = 'none'
    }
  }
  return {
    functionName,
    parentFunctionPath
  }
}

/**
 * 匹配对象表达式
 * @param elements 对象表达式数组
 * @param key 用于匹配的属性名，默认为'label'
 * @param value 需要匹配的属性值
 * @returns 返回匹配成功的元素的索引，如果没有找到则返回-1
 */
export const matchObjectExpress = (
  elements: t.ObjectExpression[],
  key = 'label',
  value: string
) => {
  return elements.findIndex((element) => {
    let labelObjectProperty = findObjectPropertyWithKey(element, key)
    // 判断是否找到匹配的属性，并且属性值与指定的值相等
    return (
      labelObjectProperty &&
      t.isLiteral(labelObjectProperty.value) &&
      value === (labelObjectProperty.value as t.StringLiteral)?.value
    )
  })
}

/**
 * 创造模板节点
 * @param input 输入，可以是一个记录字符串的对象或一个字符串模板
 * @returns 返回创建的ObjectExpression节点
 */
export const createObjectTemplateNode = (input: Record<string, any> | string) => {
  let newObjectExpression: t.ObjectExpression
  if (typeof input === 'string') {
    // 如果输入是字符串，解析字符串为AST节点
    let astCode = parser.parseExpression(input)
    if (t.isObjectExpression(astCode)) {
      newObjectExpression = astCode
    } else {
      // 如果解析结果不是对象表达式，则抛出错误
      throw new Error('createObjectTemplateNode提供input格式错误')
    }
  } else {
    // 如果输入是对象，则根据对象的键值对创建对象表达式节点
    newObjectExpression = t.objectExpression(
      Object.entries(input).map(([key, value]) => {
        let valueNode: t.Expression

        // 根据值的类型创建相应的AST节点
        switch (typeof value) {
          case 'boolean':
            valueNode = t.booleanLiteral(value)
            break
          case 'number':
            valueNode = t.numericLiteral(value)
            break
          case 'string':
            valueNode = t.stringLiteral(value)
            break
          default:
            // 对于未知类型，默认创建null字面量节点
            valueNode = t.nullLiteral()
            break
        }
        return t.objectProperty(t.identifier(key), valueNode)
      })
    )
  }
  return newObjectExpression
}
/**
 * 新增对象属性值
 * @param elements 对象表达式数组
 * @param key 要添加属性的键名，默认为'prop'
 * @param value 要添加属性的值
 * @param newProperty 新的属性，可以是字符串或者属性对象
 * @returns 修改后的对象表达式数组
 */
export const replaceExpressionProperty = (
  elements: t.ObjectExpression[],
  key: string = 'prop',
  value: string,
  newProperty: string | Record<string, any>
) => {
  // 查找与指定键名和值匹配的对象表达式索引
  const matchObjIndex = matchObjectExpress(elements, key, value)

  // 如果找到匹配项，则为其添加新属性
  if (matchObjIndex > -1) {
    elements[matchObjIndex] = addObjectNewProperty(elements[matchObjIndex], newProperty)
  }
  return elements
}

/**
 * 获取generator配置对象
 * @returns 配置对象
 */
export const getGeneratorOption = (): GeneratorOptions => {
  // 默认的生成器配置项
  let options: GeneratorOptions = {
    compact: 'auto',
    concise: false,
    retainLines: false,
    jsescOption: {
      minimal: true
    }
  }
  return options
}

/**
 * 获取parser.parse配置对象
 * @returns 配置对象
 */
export const getParserOption = (): ParserOptions => {
  // 解析器配置项
  const options: ParserOptions = {
    allowImportExportEverywhere: false,
    plugins: ['jsx', 'typescript', 'asyncGenerators', 'classProperties', 'decorators-legacy'],
    sourceType: 'module'
  }
  return options
}

/**
 * 重置对象属性数组中的索引属性值
 * @param elements 对象表达式数组
 * @returns 修改后的对象表达式数组
 */
export const resetIndexObjectProperty = (elements: t.ObjectExpression[]) => {
  // 重置索引计数器
  let count = 0

  // 遍历每个对象表达式，更新或添加索引属性
  for (const element of elements) {
    // 查找现有的索引属性
    const indexProperty = findObjectPropertyWithKey(element, 'index')

    // 如果存在索引属性，则更新其值；否则，添加新的索引属性
    if (indexProperty && indexProperty.value) {
      indexProperty.value = t.numericLiteral(count)
    } else {
      const newIndexProperty = t.objectProperty(t.identifier('index'), t.numericLiteral(count))
      element.properties.push(newIndexProperty)
    }

    // 更新索引计数器
    count++
  }
  return elements
}
