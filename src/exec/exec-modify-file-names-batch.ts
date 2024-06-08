import path from 'path'
import { Exec } from './index'
interface ModifyResult {
  oldFilePath: string
  newFilePath: string
}

export type ModifyResultReturnType = {
  changeCount: number
  changeRecords: ModifyResult[]
}

interface PreviewResult {
  oldFilePath: string
  newFilePath: string
  oldFilename?: string
  newFilename?: string
  oldDirname?: string
  newDirname?: string
  oldExtname?: string
  newExtname?: string
  isChange: boolean
}

export type PriviewResultReturnType = {
  changeCount: number
  changeRecords: PreviewResult[]
}

type ModifyFilenameOptions = {
  filename?: string
  extname?: string
  dirname?: string
  filenameReg?: RegExp
  extnameReg?: RegExp
  dirnameReg?: RegExp
  ignoreFilesPatterns?: Array<RegExp>
}

type ModifyFilenameCustomOptions = {
  customFilename?: CustomFilenameFunction
  customExtname?: CustomExtnameFunction
  customDirname?: CustomDirnameFunction
  filenameReg?: RegExp
  extnameReg?: RegExp
  dirnameReg?: RegExp
  ignoreFilesPatterns?: Array<RegExp>
}

interface CustomFilenameFunction {
  (oldFilename: string): string
}
interface CustomExtnameFunction {
  (oldExtname: string): string
}
interface CustomDirnameFunction {
  (oldDirname: string): string
}

class ModifyFilenameExec {
  exec: Exec
  constructor(dir: string) {
    this.exec = new Exec(dir)
  }

  // 确保文件扩展名以点开头
  private ensureExtname(extname: string): string {
    return extname.startsWith('.') ? extname : `.${extname}`
  }

  /**
   * 批量查询符合修改文件名条件的文件信息列表。
   * 此方法根据提供的修改文件名选项，筛选出符合特定条件的文件列表。
   * 条件包括文件名、扩展名、目录名的匹配，以及是否被忽略文件模式匹配。
   *
   * @param modifyFilenameOptions 可选参数，包含文件名修改的配置选项。
   *   如果未提供此参数，则默认筛选所有文件。
   * @returns 返回符合修改条件的文件信息列表。
   */
  execModifyFileNamesBatchQuery = (
    modifyFilenameOptions?: ModifyFilenameOptions | ModifyFilenameCustomOptions
  ) => {
    const targetList = this.exec.fsInstance.getFileInfoList().filter((item) => {
      const isFilenameMatch =
        !modifyFilenameOptions?.filenameReg ||
        modifyFilenameOptions?.filenameReg.test(item.filename)
      const isExtnameMatch =
        !modifyFilenameOptions?.extnameReg || modifyFilenameOptions?.extnameReg.test(item.extname)
      const isDirnameMatch =
        !modifyFilenameOptions?.dirnameReg || modifyFilenameOptions?.dirnameReg.test(item.dirname)
      const isIgnored =
        modifyFilenameOptions?.ignoreFilesPatterns?.some((pattern) =>
          pattern.test(item.filePath)
        ) ?? false

      return isFilenameMatch && isExtnameMatch && isDirnameMatch && !isIgnored
    })

    return targetList
  }

  /**
   * 批量预览修改文件名的效果。
   * 此方法根据提供的修改文件名选项，对一批文件进行预处理，展示出如果按照这些选项修改，文件名将会发生什么变化。
   * 这对于在实际修改前确认修改效果非常有用，避免了潜在的错误或不期望的变更。
   *
   * @param modifyFilenameOptions 包含用于修改文件名的各种选项的对象。
   * @returns 返回一个数组，其中每个元素都包含了原始文件名和拟修改后的文件名的详细比较。
   */
  execModifyFileNamesBatchPreview = (
    modifyFilenameOptions: ModifyFilenameOptions
  ): PriviewResultReturnType => {
    const targetList = this.execModifyFileNamesBatchQuery(modifyFilenameOptions)

    const replaceResult = targetList.map((item) => {
      const newFilename =
        modifyFilenameOptions.filenameReg && modifyFilenameOptions.filename
          ? item.filename.replace(modifyFilenameOptions.filenameReg, modifyFilenameOptions.filename)
          : item.filename
      let newExtname =
        modifyFilenameOptions.extnameReg && modifyFilenameOptions.extname
          ? item.extname.replace(modifyFilenameOptions.extnameReg, modifyFilenameOptions.extname)
          : item.extname
      const newDirname =
        modifyFilenameOptions.dirnameReg && modifyFilenameOptions.dirname
          ? item.dirname.replace(modifyFilenameOptions.dirnameReg, modifyFilenameOptions.dirname)
          : item.dirname
      newExtname = this.ensureExtname(newExtname)
      const newFilePath = path.format({
        dir: newDirname,
        name: newFilename,
        ext: newExtname
      })
      return {
        oldFilePath: item.filePath,
        newFilePath,
        isChange: item.filePath !== newFilePath
      }
    })
    return { changeCount: replaceResult.length, changeRecords: replaceResult }
  }
  /**
   * 批量修改文件名的执行函数。
   *
   * @param modifyFilenameOptions 修改文件名的选项对象，包含文件名、扩展名和目录名的正则表达式和替换值。
   * @returns 返回一个对象，包含修改的文件数量和修改记录。
   */
  execModifyFileNamesBatch = (
    modifyFilenameOptions: ModifyFilenameOptions
  ): ModifyResultReturnType => {
    const changeRecords: ModifyResult[] = []
    let changeCount = 0

    const targetList = this.execModifyFileNamesBatchQuery(modifyFilenameOptions)

    targetList.forEach((fileInfo) => {
      const newFilename =
        modifyFilenameOptions.filenameReg && modifyFilenameOptions.filename
          ? fileInfo.filename.replace(
              modifyFilenameOptions.filenameReg,
              modifyFilenameOptions.filename
            )
          : fileInfo.filename
      let newExtname =
        modifyFilenameOptions.extnameReg && modifyFilenameOptions.extname
          ? fileInfo.extname.replace(
              modifyFilenameOptions.extnameReg,
              modifyFilenameOptions.extname
            )
          : fileInfo.extname
      const newDirname =
        modifyFilenameOptions.dirnameReg && modifyFilenameOptions.dirname
          ? fileInfo.dirname.replace(
              modifyFilenameOptions.dirnameReg,
              modifyFilenameOptions.dirname
            )
          : fileInfo.dirname
      newExtname = this.ensureExtname(newExtname)
      const newFilePath = path.format({
        dir: newDirname,
        name: newFilename,
        ext: newExtname
      })
      try {
        const { isChange, uniqueNewFilePath } = this.exec.fsInstance.renameFile(
          fileInfo.filePath,
          newFilePath
        )
        if (isChange) {
          changeRecords.push({
            oldFilePath: fileInfo.filePath,
            newFilePath: uniqueNewFilePath
          })
          changeCount++
        }
      } catch (error) {
        console.error(`重命名文件失败：${fileInfo.filePath} -> ${newFilePath}`, error)
      }
    })
    console.log(`批量修改完毕，共${changeCount}个文件产生变化`)
    return { changeCount, changeRecords }
  }

  /**
   * 此方法根据提供的自定义选项逐个修改文件名，并记录修改结果。
   * 它首先根据选项查询需要修改的文件列表，然后对每个文件应用自定义的文件名、扩展名和目录名修改逻辑。
   * 如果修改成功，它会记录变更，并增加修改计数；如果修改失败，它会打印错误信息。
   *
   * @param modifyFilenameCustomOptions 修改文件名的自定义选项，包括自定义文件名、扩展名和目录名的函数。
   * @returns 返回一个对象，包含修改计数和变更记录列表。
   */
  execModifyFileNamesBatchCustom = (
    modifyFilenameCustomOptions: ModifyFilenameCustomOptions
  ): ModifyResultReturnType => {
    const changeRecords: ModifyResult[] = []
    let changeCount = 0

    const targetList = this.execModifyFileNamesBatchQuery(modifyFilenameCustomOptions)

    targetList.forEach((fileInfo) => {
      const newFilename = modifyFilenameCustomOptions.customFilename
        ? modifyFilenameCustomOptions.customFilename(fileInfo.filename)
        : fileInfo.filename
      let newExtname = modifyFilenameCustomOptions.customExtname
        ? modifyFilenameCustomOptions.customExtname(fileInfo.extname)
        : fileInfo.extname
      const newDirname = modifyFilenameCustomOptions.customDirname
        ? modifyFilenameCustomOptions.customDirname(fileInfo.dirname)
        : fileInfo.dirname

      newExtname = this.ensureExtname(newExtname)
      const newFilePath = path.format({
        dir: newDirname,
        name: newFilename,
        ext: newExtname
      })
      try {
        const { isChange, uniqueNewFilePath } = this.exec.fsInstance.renameFile(
          fileInfo.filePath,
          newFilePath
        )
        if (isChange) {
          changeRecords.push({
            oldFilePath: fileInfo.filePath,
            newFilePath: uniqueNewFilePath
          })
          changeCount++
        }
      } catch (error) {
        console.error(`重命名文件失败：${fileInfo.filePath} -> ${newFilePath}`, error)
      }
    })

    console.log(`批量修改完毕，共${changeCount}个文件产生变化`)
    return { changeCount, changeRecords }
  }
}

export const useModifyFilenameExec = (dir: string) => {
  return new ModifyFilenameExec(dir)
}

export const useModifyFilenameExecPreset = (
  dir: string,
  mode: 'preview' | 'exec',
  modifyFilenameOptions: ModifyFilenameOptions
) => {
  const exec = new ModifyFilenameExec(dir)
  if (mode === 'preview') {
    return exec.execModifyFileNamesBatchPreview(modifyFilenameOptions)
  } else if (mode === 'exec') {
    return exec.execModifyFileNamesBatch(modifyFilenameOptions)
  }
}

// test
export function test() {
  const modifyFilenameOptions: ModifyFilenameOptions = {
    filename: '',
    extname: '.test',
    extnameReg: /\.pzc/i,
    ignoreFilesPatterns: []
  }

  const modify = new ModifyFilenameExec(path.join('src copy'))
  modify.execModifyFileNamesBatchQuery(modifyFilenameOptions)
}
