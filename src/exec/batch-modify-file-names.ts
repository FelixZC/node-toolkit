/**
 * 按指定规则批量修改文件名
 */
import { Exec } from './index'
const exec = new Exec()
const fsInstance = exec.fsInstance
const filenameReg = /([ _]\d{2,}|\d{2,}[ _])/
const customFilename = (oldFilename: string) => {
  if (filenameReg.exec(oldFilename)) {
    return oldFilename.replace(filenameReg, '')
  } else {
    return oldFilename
  }
}
//TODO 添加预览结果
fsInstance.modifyFilename(customFilename)
