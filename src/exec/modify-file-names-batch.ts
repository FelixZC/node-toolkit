import { Exec } from './index'

/**
 * 按指定规则批量修改文件名的公共方法。
 * @param filenameReg 用于匹配文件名中需要修改的部分的正则表达式。
 */
export const batchRenameFiles = (filenameReg: RegExp) => {
  const exec = new Exec()
  const fsInstance = exec.fsInstance

  const customFilename = (oldFilename: string) => {
    if (filenameReg.exec(oldFilename)) {
      return oldFilename.replace(filenameReg, '')
    } else {
      return oldFilename
    }
  }

  // 执行文件名修改
  fsInstance.modifyFilename(customFilename)
}

// 示例用法：
const filenameReg = /([ _]\d{2,}|\d{2,}[ _])/

// 调用公共方法批量修改文件名
batchRenameFiles(filenameReg)
