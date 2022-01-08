export default function transformer(file, api) {
  const j = api.jscodeshift
  return j(file.source)
    .find(j.BooleanTypeAnnotation)
    .replaceWith(j.booleanTypeAnnotation())
    .toSource()
}
