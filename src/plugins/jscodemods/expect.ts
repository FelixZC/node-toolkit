import { Transform } from 'jscodeshift'

const transformer: Transform = (file, api) => {
  const j = api.jscodeshift
  return j(file.source)
    .find(j.MemberExpression, {
      object: {
        callee: {
          name: 'expect',
          type: 'Identifier',
        },

        type: 'CallExpression',
      },

      property: {
        type: 'Identifier',
      },
    })
    .forEach((path) => {
      const toBeArgs = path.parentPath.node.arguments
      const expectArgs = path.node.object.arguments
      const name = path.node.property.name
      const isNot = name.indexOf('Not') !== -1 || name.indexOf('Exclude') !== -1
      const renaming = {
        toBeA: 'toBeInstanceOf',
        toBeAn: 'toBeInstanceOf',
        toBeFewerThan: 'toBeLessThan',
        toBeGreaterThanOrEqualTo: 'toBeGreaterThanOrEqual',
        toBeLessThanOrEqualTo: 'toBeLessThanOrEqual',
        toBeMoreThan: 'toBeGreaterThan',
        toExclude: 'not.toContain',
        toExist: 'toBeTruthy',
        toInclude: 'toContain',
        toNotBe: 'not.toBe',
        toNotBeA: 'not.toBeInstanceOf',
        toNotBeAn: 'not.toBeInstanceOf',
        toNotContain: 'not.toContain',
        toNotEqual: 'not.toEqual',
        toNotExist: 'toBeFalsy',
        toNotHaveBeenCalled: 'not.toHaveBeenCalled',
        toNotInclude: 'not.toContain',
        toNotMatch: 'not.toMatch',
        toNotThrow: 'not.toThrow',
      }

      if (renaming[name]) {
        path.node.property.name = renaming[name]
      }

      if (
        name === 'toBeA' ||
        name === 'toBeAn' ||
        name === 'toNotBeA' ||
        name === 'toNotBeAn'
      ) {
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
          path.node.property.name = isNot
            ? 'not.toMatchObject'
            : 'toMatchObject'
        }
      }
    })
    .toSource()
}

export default transformer
