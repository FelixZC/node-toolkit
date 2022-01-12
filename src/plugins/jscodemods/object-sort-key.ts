import { Transform } from 'jscodeshift'
const vueDefaultOrder = [
  'el',
  'name',
  'parent',
  'functional',
  ...['delimiters', 'comments'],
  ...['components', 'directives', 'filters'],
  'extends',
  'mixins',
  'inheritAttrs',
  'model',
  ...['props', 'propsData'],
  'data',
  'computed',
  'watch',
  ...[
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpadte',
    'updated',
    'beforeDestory',
    'destroyed',
  ],
  'methods',
  ...['template', 'render'],
  'renderError',
]

const transformer: Transform = (fileInfo, api) => {
  const j = api.jscodeshift

  const normalObjectSort = (obj) => {
    obj.value.properties.sort((a, b) => {
      if (!a.key || !b.key) {
        return 0
      }

      const aKeyName = a.key.name || a.key.value
      const bKeyName = b.key.name || b.key.value
      if (!aKeyName || !bKeyName) {
        return 0
      }

      return aKeyName.localeCompare(bKeyName)
    })
  }

  const vueObjectSort = (object) => {
    if (object.properties) {
      object.properties.sort((a, b) => {
        if (!a.key || !b.key) {
          return 0
        }
        const aKeyName = a.key.name || a.key.value
        const bKeyName = b.key.name || b.key.value
        if (!aKeyName || !bKeyName) {
          return 0
        }

        return (
          vueDefaultOrder.indexOf(aKeyName) - vueDefaultOrder.indexOf(bKeyName)
        )
      })
    }
  }

  let b = j(fileInfo.source)
    .find(j.ObjectExpression)
    .forEach(normalObjectSort)
    .toSource()
  b = j(b).find(j.ObjectPattern).forEach(normalObjectSort).toSource() //vue2

  if (fileInfo.path.endsWith('.vue') || fileInfo.path.includes('mixin')) {
    b = j(b)
      .find(j.ExportDefaultDeclaration, {
        declaration: {
          type: 'ObjectExpression',
        },
      })
      .forEach((path) => vueObjectSort(path.node.declaration))
      .toSource()
  } //vue3

  if (fileInfo.path.endsWith('.vue') || fileInfo.path.includes('mixin')) {
    b = j(b)
      .find(j.ExportDefaultDeclaration, {
        declaration: {
          type: 'CallExpression',
        },
      })
      .forEach((path) => vueObjectSort(path.node.declaration.arguments[0]))
      .toSource()
  }

  return j(b)
    .find(j.Identifier, {
      name: 'Vue',
    })
    .filter((path) => path.parentPath.value.type === 'NewExpression')
    .map((path) => path.parentPath)
    .forEach(vueObjectSort)
    .toSource()
}

export default transformer
