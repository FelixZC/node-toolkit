import runVueCodemod from '../plugins/use-vue-codemod'
import type { Transform } from 'jscodeshift'
import type { ExecFileInfo } from './common'

const runCodemod = (fileInfo: ExecFileInfo, codemodList: Transform[]) => {
  codemodList.reduce((previousFileInfo, currentCodemode) => {
    const newContent = runVueCodemod(previousFileInfo, currentCodemode, {}) as string
    previousFileInfo.source = newContent
    return previousFileInfo
  }, fileInfo)
  return fileInfo.source
}

export default runCodemod
