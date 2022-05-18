import runVueCodemod from '../plugins/use-vue-codemod'
import type { ExecFileInfo } from './common'
import type { Transform } from 'jscodeshift'

const runCodemod = (fileInfo: ExecFileInfo, codemodList: Transform[]) => {
  codemodList.reduce((previousFileInfo, currentCodemode) => {
    const newContent = runVueCodemod(previousFileInfo, currentCodemode, {}) as string
    previousFileInfo.source = newContent
    return previousFileInfo
  }, fileInfo)
  return fileInfo.source
}

export default runCodemod
