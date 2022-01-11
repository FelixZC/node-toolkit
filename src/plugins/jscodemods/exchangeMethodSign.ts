import { Transform } from 'jscodeshift'

const transformer: Transform = (fileInfo, api) => {
  const j = api.jscodeshift
  const root = j(fileInfo.source)
  const methodList = [
    {
      argument: ['data', 'child', 'isMirrorData'],
      name: 'getAllParent',
    },
    {
      argument: ['data', 'child', 'isMirrorData'],
      name: 'getParent',
    },
    {
      argument: ['date', 'key', 'value'],
      name: 'setProperty',
    },
    {
      argument: ['data', 'key', 'value'],
      name: 'setAllNodeProperty',
    },
    {
      argument: ['data', 'key', 'oldValue', 'newValue'],
      name: 'replace',
    },
    {
      argument: ['data', 'key', 'firstValue', 'secondValue'],
      name: 'reverse',
    },
    {
      argument: ['data', 'row', 'addData'],
      name: 'lazyLoading',
    },
    {
      argument: [
        'data',
        'rootKid',
        'kid',
        'parentKid',
        'expanded',
        'expandFirstNode',
        'defaultSort',
        'reDeal',
        'hasLazyLoading',
        'firstInit',
      ],
      name: 'deal2TreeData',
    },
    {
      argument: [
        'data',
        'rootKid',
        'kid',
        'parentKid',
        'expanded',
        'expandFirstNode',
        'defaultSort',
        'reDeal',
        'hasLazyLoading',
        'firstInit',
      ],
      name: 'sortArryInVirtualTree',
    },
    {
      argument: ['data', 'value', 'kid', 'single'],
      name: 'getData',
    },
    {
      argument: ['data', 'parentData', 'kid', 'parentkid'],
      name: 'getChildren',
    },
    {
      argument: ['data', 'parentData', 'isMirrorData'],
      name: 'getAllChildren',
    },
    {
      argument: ['data', 'kid', 'parentKid'],
      name: 'getRootKids',
    },
    {
      argument: ['treeData', 'currentRow', 'isExpand'],
      name: 'expandTreeEvent',
    },
  ]

  const updateArgumentsCalls = (nodePath, method) => {
    while (nodePath.parent && nodePath.parent.value.type !== 'CallExpression') {
      nodePath = nodePath.parent
    }

    if (nodePath.parent) {
      const { node } = nodePath.parent
      const argumentsAsObject = j.objectExpression(
        node.arguments.map((arg, i) => {
          const node = j.property('init', j.identifier(method.argument[i]), arg)
          node.shorthand = true
          return node
        })
      )
      node.arguments = [argumentsAsObject]
      return node
    }
  }

  let localRoot

  for (const method of methodList) {
    //查询对象引用
    localRoot = root
      .find(j.Identifier, {
        name: method.name,
      })
      .forEach(updateArgumentsCalls, method)
  }

  return localRoot.toSource({
    quote: 'single',
    trailingComma: true,
  })
}

export default transformer
