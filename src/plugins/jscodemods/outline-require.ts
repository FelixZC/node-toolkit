import { Transform } from 'jscodeshift'

const transformer: Transform = (file, api, options) => {
  if (file.path.indexOf('/__tests__/') == -1) {
    return null
  }

  const printOptions = options.printOptions || {
    quote: 'single'
  }
  const REQUIRE_CALL = {
    callee: {
      name: 'require'
    },
    type: 'CallExpression'
  }
  const j = api.jscodeshift
  const root = j(file.source)
  const { program } = root.get().value
  const { body } = program
  const firstComment = body[0].comments

  const isJestCall = (node) =>
    node.type == 'CallExpression' &&
    node.callee.type == 'MemberExpression' &&
    node.callee.object.type == 'Identifier' &&
    node.callee.object.name == 'jest'

  const isMockModule = (node) =>
    node &&
    ((node.type == 'CallExpression' &&
      node.callee.type == 'Identifier' &&
      node.callee.name == 'require' &&
      node.arguments.length &&
      node.arguments[0].type == 'Literal' &&
      ['mock-modules', 'mocks'].indexOf(node.arguments[0].value) != -1) ||
      (node.type == 'AssignmentExpression' && isMockModule(node.right)) ||
      (node.type == 'VariableDeclaration' &&
        node.declarations.length &&
        node.declarations.some((declaration) => isMockModule(declaration.init))))

  const isDescribeCall = (node) =>
    node.type == 'CallExpression' &&
    node.callee.type == 'Identifier' &&
    node.callee.name == 'describe'

  const isMockLike = (node) =>
    node.type == 'CallExpression' &&
    node.callee.type == 'MemberExpression' &&
    ((node.callee.object.type == 'Identifier' &&
      (node.callee.object.name == 'mocks' || node.callee.object.name == 'mockModules')) ||
      (node.callee.object.type == 'CallExpression' && isMockLike(node.callee.object)))

  const isClassDeclaration = (node) => node.type == 'ClassDeclaration'

  const isFunctionDeclaration = (node) => node.type == 'FunctionDeclaration'

  const isFunctionAssignment = (node) =>
    node.type == 'VariableDeclaration' &&
    node.declarations.some(
      (declaration) => declaration.init && declaration.init.type == 'FunctionExpression'
    )

  const findInsertionPoint = (body) => {
    var index = 0

    for (let i = 0; i < body.length; i++) {
      const item = body[i]

      if (
        isJestCall(item) ||
        isMockModule(item) ||
        (item.expression && isMockLike(item.expression))
      ) {
        index = i
      } // Stop looking at the first describe block, a class or a function

      if (
        (item.expression && isDescribeCall(item.expression)) ||
        isClassDeclaration(item) ||
        isFunctionDeclaration(item) ||
        isFunctionAssignment(item)
      ) {
        // If we don't have an insertion point, put everything
        // right before the first describe block.
        if (index == 0) {
          index = i - 1
        }

        break
      }
    }

    return index + 1
  }

  const createRequire = (id, requireName) =>
    j.variableDeclarator(id, j.callExpression(j.identifier('require'), [j.literal(requireName)]))

  const isSideEffectComment = (node) =>
    node.comments && node.comments.length == 1 && /\@side-effect/.test(node.comments[0].value)

  const isFluxStore = (node, path) => /Store/.test(node.arguments[0].value)

  root
    .find(j.CallExpression, REQUIRE_CALL)
    .filter(
      (p) =>
        p.value.arguments.length == 1 &&
        p.value.arguments[0].type == 'Literal' &&
        p.parent.value.type == 'AssignmentExpression' &&
        p.parent.value.left.type == 'Identifier' &&
        p.parent.parent.value.type == 'ExpressionStatement' &&
        p.parent.parent.parent.value != program &&
        !isSideEffectComment(p.parent.parent.value) &&
        !isFluxStore(p.value, p.parent.parent)
    )
    .forEach((p) => {
      const { parent } = p
      const name = parent.value.left.name
      const require = p.value.arguments[0].value
      const hasVariableDeclarator = root
        .find(j.VariableDeclarator, {
          id: {
            name
          }
        })
        .filter(
          (p) => !p.value.init || p.value.init.type == 'Literal' || p.value.init.vlaue == 'null'
        )
        .replaceWith((p) => createRequire(j.identifier(name), require))
        .size()

      if (hasVariableDeclarator) {
        j(parent).remove()
      } else {
        j(parent).replaceWith(createRequire(j.identifier(name), require))
      }
    })
  const requires = []
  root
    .find(j.VariableDeclarator, {
      init: REQUIRE_CALL
    })
    .filter((p) => p.parent.parent && p.parent.parent.value != program)
    .forEach((p) =>
      requires.unshift(
        j.variableDeclaration('var', [createRequire(p.value.id, p.value.init.arguments[0].value)])
      )
    )
    .remove()
  body.splice(findInsertionPoint(body), 0, ...requires.reverse()) // Cleanup empty beforeEach calls

  root
    .find(j.CallExpression, {
      arguments: [
        {
          body: []
        }
      ],
      callee: {
        name: 'beforeEach'
      }
    })
    .filter((p) => !p.value.arguments[0].body.body.length)
    .remove() // Cleanup duplicate requires

  const requireNames = new Set()
  root
    .find(j.VariableDeclarator, {
      init: REQUIRE_CALL
    })
    .filter((p) => p.parent.parent && p.parent.parent.value == program)
    .filter((p) => {
      const { name } = p.value.id
      const requireName = p.value.init.arguments[0].value
      const combined = name + '|' + requireName
      const has = requireNames.has(combined)

      if (!has) {
        requireNames.add(combined)
      }

      return has
    })
    .remove() // Cleanup unused requires

  root
    .find(j.VariableDeclarator, {
      init: REQUIRE_CALL
    })
    .filter((p) => !!p.value.id && p.value.id.name)
    .filter(
      (p) =>
        root
          .find(j.Identifier, {
            name: p.value.id.name
          })
          .size() == 1
    )
    .filter((p) => p.value.id.name != 'React' || root.find(j.JSXElement).size() == 0)
    .remove()
  body[0].comments = firstComment
  return root.toSource(printOptions)
}

export default transformer
