import fsUtils from '../utils/fs'
export async function getDirAndFileInfo(dir: string, isUseIgnoredFiles: boolean) {
  const fsInstance = new fsUtils(dir, isUseIgnoredFiles)
  const dirInfoWithStatsList = await fsInstance.getDirectoryListWithStats()
  dirInfoWithStatsList.shift()
  const fileInfoWithStatsList = await fsInstance.getFileInfoListWithStats()
  return [...dirInfoWithStatsList, ...fileInfoWithStatsList]
}
