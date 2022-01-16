import { Transform } from 'jscodeshift'
const vueDefaultOrder = [
  'el',
  'name',
  'parent',
  'functional',
  ...['comments', 'delimiters'],
  ...['components', 'directives', 'filters'],
  'extends',
  'mixins',
  'inject',
  'provide',
  'inheritAttrs',
  'model',
  'emits',
  ...['props', 'propsData'],
  'data',
  'computed',
  'watch',
  ...[
    'beforeCreate',
    'beforeDestory',
    'beforeMount',
    'beforeUpadte',
    'created',
    'destroyed',
    'mounted',
    'updated',
  ],
  'methods',
  ...['render', 'template'],
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

      if (typeof aKeyName === 'number' && typeof bKeyName === 'number') {
        return aKeyName - bKeyName
      }

      if (typeof aKeyName === 'string' && typeof bKeyName === 'string') {
        return aKeyName.localeCompare(bKeyName)
      }

      return 0
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
