/**
 * 按指定规则批量修改文件名
 */
import * as exec from './index'

const fsInstance = exec.getFsInstance()
const filenameReg = /([ _]\d{2,}|\d{2,}[ _])/
const customFilename = (oldFilename: string) => {
  if (filenameReg.exec(oldFilename)) {
    return oldFilename.replace(filenameReg, '')
  } else {
    return oldFilename
  }
}
//先看下结果
//763587_计算机网络自顶向下方法第8版=>计算机网络自顶向下方法第8版
// const fileInfoList = fsInstance.getFileInfoList()
// fileInfoList.forEach((item) => {
//   const result = customFilename(item.filename)
//   console.log(result)
// })
fsInstance.modifyFilename(customFilename)
