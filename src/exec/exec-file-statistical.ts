import fsUtils, { getFileInfo } from '../utils/fs'
import { buildTree, groupBy, pickProperties } from '../utils/common'
import mdUtils from '../utils/md'

class Exec {
  fsInstance: fsUtils // 文件系统实例属性
  constructor(dir: string, isUseIgnoredFiles: boolean) {
    this.fsInstance = new fsUtils(dir, isUseIgnoredFiles)
  }
  getProjectTree = () => {
    const pathList = this.fsInstance.filePathList.concat(this.fsInstance.dirPathList)
    const treeData = pathList.map((item) => {
      return {
        ...getFileInfo(item),
        children: []
      }
    })
    const trees = buildTree(treeData, 'filePath', 'dir')
    const result = pickProperties(trees, ['base', 'dir', 'children'])
    const resultJson = JSON.stringify(result, null, 2)
    const resultMd = mdUtils.generateProjectTree(result)
    return {
      resultJson,
      resultMd
    }
  }

  /**
   * 对文件信息列表进行分类分组，根据文件的扩展名进行分组。
   * @returns {string} 返回分类分组后的文件信息的JSON字符串。
   */
  classifyFilesByExtname = (): string => {
    const fileInfoList = this.fsInstance.getFileInfoList()
    const group = groupBy(fileInfoList, 'ext')
    return JSON.stringify(group, null, 2)
  }

  classifyFilesByBasename = () => {
    const fileInfoList = this.fsInstance.getFileInfoList()
    const group = groupBy(fileInfoList, 'name')
    return JSON.stringify(group, null, 2)
  }
}

export const createFileStatisticalExec = async (
  dir: string,
  mode: 'tree' | 'ext' | 'base',
  isUseIgnoredFiles: boolean
) => {
  const exec = new Exec(dir, isUseIgnoredFiles)
  if (mode === 'tree') {
    return exec.getProjectTree()
  } else if (mode === 'ext') {
    return exec.classifyFilesByExtname()
  } else if (mode === 'base') {
    return exec.classifyFilesByBasename()
  }
}
