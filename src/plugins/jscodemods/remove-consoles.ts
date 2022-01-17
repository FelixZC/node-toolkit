import { Transform } from 'jscodeshift'

const transformer: Transform = (fileInfo, api) => {
  const j = api.jscodeshift
  return j(fileInfo.source)
    .find(j.CallExpression, {
      callee: {
        object: {
          name: 'console',
          type: 'Identifier'
        },
        type: 'MemberExpression'
      }
    })
    .remove()
    .toSource()
}

export default transformer
