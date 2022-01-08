import { parse as parseSFC, stringify as stringifySFC } from './sfcUtils'
import type { Transform } from 'jscodeshift'
function getCodemodActuator(codemodList: Transform[]) {
  const sourceTransform: Transform = (fileInfo, api, options) => {
    codemodList.reduce((previousFileInfo, currentCodemode) => {
      const newContent = currentCodemode(previousFileInfo, api, options) as string
      previousFileInfo.source = newContent
      return previousFileInfo
    }, fileInfo)
    return fileInfo.source
  }
  const transformWraper: Transform = (fileInfo, api, options) => {
    if (!fileInfo.path.endsWith('.vue')) {
      return sourceTransform(fileInfo, api, options)
    }
    const { descriptor } = parseSFC(fileInfo.source, { filename: fileInfo.path })
    const scriptBlock = descriptor.script
    if (scriptBlock) {
      fileInfo.source = scriptBlock.content
      scriptBlock.content = sourceTransform(fileInfo, api, options) as string
    }
    return stringifySFC(descriptor)
  }
  return transformWraper
}

const useCodemod = (codemodPathList: string[]) => {
  try {
    const codemodList: Transform[] = codemodPathList.map((filePath) => {
      const result = require(filePath)
      if (result.default) {
        return result.default
      }
      return result
    })
    return getCodemodActuator(codemodList)
  } catch (e) {
    console.log('获取someCodemod失败')
    console.log(e)
  }
}
export default useCodemod
