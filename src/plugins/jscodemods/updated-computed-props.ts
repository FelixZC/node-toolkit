const keywords = {
  this: true,
  function: true,
  if: true,
  return: true,
  var: true,
  else: true,
  for: true,
  new: true,
  in: true,
  typeof: true,
  while: true,
  case: true,
  break: true,
  try: true,
  catch: true,
  delete: true,
  throw: true,
  switch: true,
  continue: true,
  default: true,
  instanceof: true,
  do: true,
  void: true,
  finally: true,
  with: true,
  debugger: true,
  implements: true,
  interface: true,
  package: true,
  private: true,
  protected: true,
  public: true,
  static: true,
  class: true,
  enum: true,
  export: true,
  extends: true,
  import: true,
  super: true,
  true: true,
  false: true,
  null: true,
  abstract: true,
  boolean: true,
  byte: true,
  char: true,
  const: true,
  double: true,
  final: true,
  float: true,
  goto: true,
  int: true,
  long: true,
  native: true,
  short: true,
  synchronized: true,
  throws: true,
  transient: true,
  volatile: true
}

module.exports = function (file, api) {
  const j = api.jscodeshift
  const root = j(file.source)
  const didTransform = root
    .find(j.MemberExpression, { computed: true, property: { type: 'Literal' } })
    .filter((p) => !!keywords[p.value.property.value])
    .replaceWith((p) =>
      j.memberExpression(p.value.object, j.identifier(p.value.property.value), false)
    )
    .size()

  return didTransform ? root.toSource() : null
}
