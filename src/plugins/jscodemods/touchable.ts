import { Transform } from 'jscodeshift'

function getJSXName(value) {
  return value.openingElement.name.name
}

const transformer: Transform = (file, api) => {
  if (file.source.indexOf('<Touchable') === -1) {
    return null
  }

  const j = api.jscodeshift
  const root = j(file.source)
  let didTransform = false
  root.find(j.JSXElement).forEach((p) => {
    const parent = p.value

    if (
      getJSXName(parent) !== 'TouchableBounce' &&
      getJSXName(parent) !== 'TouchableOpacity'
    ) {
      return
    }

    if (parent.children.length !== 3) {
      return
    }

    const child = parent.children[1]

    if (!(child.type === 'JSXElement' && getJSXName(child) === 'View')) {
      return
    }

    parent.openingElement.attributes.push(...child.openingElement.attributes)
    parent.children = child.children
    didTransform = true
  })
  return didTransform ? root.toSource() : null
}

export default transformer
