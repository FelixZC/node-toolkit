module.exports = (fileInfo, api) => {
  const j = api.jscodeshift

  return j(fileInfo.source)
    .find(j.SwitchStatement)
    .forEach(function (path) {
      console.log(path)
      path.value.cases.sort((v1, v2) => {
        const v1Index = v1.test ? v1.test.value : 'a'
        const v2Index = v2.test ? v2.test.value : 'b'
        const result = v1Index.localeCompare(v2Index)
        return result
      })
    })
    .toSource()
}
