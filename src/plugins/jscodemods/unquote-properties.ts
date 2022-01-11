/**
 * Removes quotes from object properties whose keys are strings which are valid
 * identifiers. Does not handle quoted methods.
 */
import { Transform } from 'jscodeshift'

const transformer: Transform = (file, api, options) => {
  const j = api.jscodeshift
  const printOptions = options.printOptions || {
    quote: 'single',
  }
  const root = j(file.source)

  const isValidIdentifierNameForProperty = (name) => {
    if (/^0[xbo]?\d+$/.test(name)) {
      return false
    }

    try {
      new Function(`({${name}: 1})`)() //eslint-disable-line no-new-func
    } catch (e) {
      return false
    }

    return true
  }

  root
    .find(j.Property, {
      computed: false,
      method: false,
    })
    .filter(
      (p) =>
        p.value.key.type === 'Literal' &&
        typeof p.value.key.value === 'string' &&
        isValidIdentifierNameForProperty(p.value.key.value)
    )
    .forEach((p) => (p.value.key = j.identifier(p.value.key.value)))
  return root.toSource(printOptions)
}

export default transformer
