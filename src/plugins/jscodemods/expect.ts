export default function transformer(file, api) {
  const j = api.jscodeshift

  return j(file.source)
    .find(j.MemberExpression, {
      object: {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'expect' }
      },
      property: { type: 'Identifier' }
    })
    .forEach((path) => {
      const toBeArgs = path.parentPath.node.arguments
      const expectArgs = path.node.object.arguments
      const name = path.node.property.name
      const isNot = name.indexOf('Not') !== -1 || name.indexOf('Exclude') !== -1

      const renaming = {
        toExist: 'toBeTruthy',
        toNotExist: 'toBeFalsy',
        toNotBe: 'not.toBe',
        toNotEqual: 'not.toEqual',
        toNotThrow: 'not.toThrow',
        toBeA: 'toBeInstanceOf',
        toBeAn: 'toBeInstanceOf',
        toNotBeA: 'not.toBeInstanceOf',
        toNotBeAn: 'not.toBeInstanceOf',
        toNotMatch: 'not.toMatch',
        toBeFewerThan: 'toBeLessThan',
        toBeLessThanOrEqualTo: 'toBeLessThanOrEqual',
        toBeMoreThan: 'toBeGreaterThan',
        toBeGreaterThanOrEqualTo: 'toBeGreaterThanOrEqual',
        toInclude: 'toContain',
        toExclude: 'not.toContain',
        toNotContain: 'not.toContain',
        toNotInclude: 'not.toContain',
        toNotHaveBeenCalled: 'not.toHaveBeenCalled'
      }
      if (renaming[name]) {
        path.node.property.name = renaming[name]
      }
      if (name === 'toBeA' || name === 'toBeAn' || name === 'toNotBeA' || name === 'toNotBeAn') {
        if (toBeArgs[0].type === 'Literal') {
          expectArgs[0] = j.unaryExpression('typeof', expectArgs[0])
          path.node.property.name = isNot ? 'not.toBe' : 'toBe'
        }
      }

      if (
        name === 'toIncludeKey' ||
        name === 'toContainKey' ||
        name === 'toExcludeKey' ||
        name === 'toNotContainKey' ||
        name === 'toNotIncludeKey'
      ) {
        expectArgs[0] = j.template.expression`Object.keys(${expectArgs[0]})`
        path.node.property.name = isNot ? 'not.toContain' : 'toContain'
      }
      if (
        name === 'toIncludeKeys' ||
        name === 'toContainKeys' ||
        name === 'toExcludeKeys' ||
        name === 'toNotContainKeys' ||
        name === 'toNotIncludeKeys'
      ) {
        toBeArgs[0] = j.identifier('e')
        path.node.property.name = isNot ? 'not.toContain' : 'toContain'
        j(path.parentPath).replaceWith(j.template.expression`\
${toBeArgs[0]}.forEach(${toBeArgs[0]} => {
  ${path.parentPath.node}
})`)
      }
      if (name === 'toMatch' || name === 'toNotMatch') {
        const arg = toBeArgs[0]
        if (arg.type === 'ObjectExpression') {
          path.node.property.name = isNot ? 'not.toMatchObject' : 'toMatchObject'
        }
      }
    })
    .toSource()
}
