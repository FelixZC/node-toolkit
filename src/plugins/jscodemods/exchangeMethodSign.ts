module.exports = (fileInfo, api) => {
  const j = api.jscodeshift
  const root = j(fileInfo.source)
  const methodList = [
    {
      name: 'getAllParent',
      argument: ['data', 'child', 'isMirrorData']
    },
    { name: 'getParent', argument: ['data', 'child', 'isMirrorData'] },
    { name: 'setProperty', argument: ['date', 'key', 'value'] },
    { name: 'setAllNodeProperty', argument: ['data', 'key', 'value'] },
    {
      name: 'replace',
      argument: ['data', 'key', 'oldValue', 'newValue']
    },
    {
      name: 'reverse',
      argument: ['data', 'key', 'firstValue', 'secondValue']
    },
    { name: 'lazyLoading', argument: ['data', 'row', 'addData'] },
    {
      name: 'deal2TreeData',
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
        'firstInit'
      ]
    },
    {
      name: 'sortArryInVirtualTree',
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
        'firstInit'
      ]
    },
    { name: 'getData', argument: ['data', 'value', 'kid', 'single'] },
    {
      name: 'getChildren',
      argument: ['data', 'parentData', 'kid', 'parentkid']
    },
    {
      name: 'getAllChildren',
      argument: ['data', 'parentData', 'isMirrorData']
    },
    { name: 'getRootKids', argument: ['data', 'kid', 'parentKid'] },
    {
      name: 'expandTreeEvent',
      argument: ['treeData', 'currentRow', 'isExpand']
    }
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
    localRoot = root.find(j.Identifier, { name: method.name }).forEach(updateArgumentsCalls, method)
  }
  return localRoot.toSource({ quote: 'single', trailingComma: true })
}
