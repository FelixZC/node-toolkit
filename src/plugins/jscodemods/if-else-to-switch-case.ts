import { Transform } from 'jscodeshift'

const transformer: Transform = (file, api, options) => {
  const j = api.jscodeshift
  const root = j(file.source)
  const replaceIfStatementBack = root
    .find(j.IfStatement)
    .forEach((path) => j(path).replaceWith(j.switchCase(path.value.test, [path.value.consequent])))
  return replaceIfStatementBack.toSource()
}

export default transformer
