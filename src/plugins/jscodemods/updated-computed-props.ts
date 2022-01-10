const keywords = {
  abstract: true,
  boolean: true,
  break: true,
  byte: true,
  case: true,
  catch: true,
  char: true,
  class: true,
  const: true,
  continue: true,
  debugger: true,
  default: true,
  delete: true,
  do: true,
  double: true,
  else: true,
  enum: true,
  export: true,
  extends: true,
  false: true,
  final: true,
  finally: true,
  float: true,
  for: true,
  function: true,
  goto: true,
  if: true,
  implements: true,
  import: true,
  in: true,
  instanceof: true,
  int: true,
  interface: true,
  long: true,
  native: true,
  new: true,
  null: true,
  package: true,
  private: true,
  protected: true,
  public: true,
  return: true,
  short: true,
  static: true,
  super: true,
  switch: true,
  synchronized: true,
  this: true,
  throw: true,
  throws: true,
  transient: true,
  true: true,
  try: true,
  typeof: true,
  var: true,
  void: true,
  volatile: true,
  while: true,
  with: true,
}

module.exports = function (file, api) {
  const j = api.jscodeshift
  const root = j(file.source)
  const didTransform = root
    .find(j.MemberExpression, {
      computed: true,
      property: {
        type: 'Literal',
      },
    })
    .filter((p) => !!keywords[p.value.property.value])
    .replaceWith((p) =>
      j.memberExpression(
        p.value.object,
        j.identifier(p.value.property.value),
        false
      )
    )
    .size()
  return didTransform ? root.toSource() : null
}
