import { Transform } from 'jscodeshift'
const transformer: Transform = (file, api) => {
  const j = api.jscodeshift
  return j(file.source)
    .find(j.BooleanTypeAnnotation)
    .replaceWith(j.booleanTypeAnnotation())
    .toSource()
}

export default transformer
