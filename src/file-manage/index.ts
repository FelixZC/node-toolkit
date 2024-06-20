import fsUtils from '../utils/fs'
export async function getDirAndFileInfo(dir: string) {
  const fsInstance = new fsUtils(dir)
  const dirInfoWithStatsList = await fsInstance.getDirectoryListWithStats()
  const fileInfoWithStatsList = await fsInstance.getFileInfoListWithStats()
  return [...dirInfoWithStatsList, ...fileInfoWithStatsList]
}
