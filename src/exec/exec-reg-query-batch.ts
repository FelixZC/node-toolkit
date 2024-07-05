import { fsUtils, readFile } from "../utils/fs";
import { getMainWindow } from "../desktop/main-window";
import { queryContentByReg } from "../utils/md";

/**
 * 执行指定目录下的批量正则查询并返回结果
 * @param {RegExp} reg - 要应用的正则表达式
 * @returns {string} - 查询结果
 */
export const execRegQueryBatch = async (
  dir: string,
  isUseIgnoredFiles: boolean,
  reg: RegExp,
  isAddSourcePath?: boolean,
  ignoreFilesPatterns?: Array<RegExp>,
) => {
  const fsInstance = new fsUtils(dir, isUseIgnoredFiles);
  let count = 1;
  const mainWindow = getMainWindow();
  let promises = fsInstance.filePathList.map(async (filePath) => {
    let result = "";
    if (
      ignoreFilesPatterns &&
      ignoreFilesPatterns.some((pattern) => pattern.test(filePath))
    ) {
      // 如果文件应该被忽略，则返回空字符串
    } else {
      const content = await readFile(filePath);
      result = queryContentByReg(content, reg);
      // 添加文件路径
      if (isAddSourcePath && result.length) {
        result = `//${filePath}${fsInstance.eol}${result}`;
      }
    }
    mainWindow &&
      mainWindow.setProgressBar(count++ / fsInstance.filePathList.length);
    return result;
  });
  let results = await Promise.all(promises);
  let str = results.join("");
  return str;
};
