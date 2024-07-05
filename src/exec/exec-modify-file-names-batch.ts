import { fsUtils, generateUniquePathWithoutFs } from "../utils/fs";
import { generateSimpleRandomString } from "../utils/random";
import { getFormattedTimestamp } from "../utils/time";
import { Logger } from "../utils/log";
import path from "path";
interface ModifyResult {
  oldFilePath: string;
  newFilePath: string;
}
export type ModifyResultReturnType = {
  changeCount: number;
  changeRecords: ModifyResult[];
};
interface PreviewResult {
  oldFilePath: string;
  newFilePath: string;
  oldFilename?: string;
  newFilename?: string;
  oldDirname?: string;
  newDirname?: string;
  oldExtname?: string;
  newExtname?: string;
  isChange: boolean;
}
export type PriviewResultReturnType = {
  changeCount: number;
  changeRecords: PreviewResult[];
};
export type ModifyFilenameOptions = {
  filename?: string;
  extname?: string;
  dirname?: string;
  customFilename?: CustomFilenameFunction;
  customExtname?: CustomExtnameFunction;
  customDirname?: CustomDirnameFunction;
  filenameReg?: RegExp;
  extnameReg?: RegExp;
  dirnameReg?: RegExp;
  ignoreFilesPatterns?: Array<RegExp>;
  addTimeStamp: boolean;
  addDateTime: boolean;
};
interface CustomFilenameFunction {
  (oldFilename: string): string;
}
interface CustomExtnameFunction {
  (oldExtname: string): string;
}
interface CustomDirnameFunction {
  (oldDirname: string): string;
}
class Exec {
  fsInstance: fsUtils; // 文件系统实例属性
  constructor(dir: string, isUseIgnoredFiles: boolean) {
    this.fsInstance = new fsUtils(dir, isUseIgnoredFiles);
  }

  // 确保文件扩展名以点开头
  private ensureExtname(extname: string): string {
    return extname.startsWith(".") ? extname : `.${extname}`;
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
    modifyFilenameOptions?: ModifyFilenameOptions,
  ) => {
    const targetList = this.fsInstance.getFileInfoList().filter((item) => {
      const isFilenameMatch =
        !modifyFilenameOptions?.filenameReg ||
        modifyFilenameOptions?.filenameReg.test(item.name);
      const isExtnameMatch =
        !modifyFilenameOptions?.extnameReg ||
        modifyFilenameOptions?.extnameReg.test(item.ext);
      const isDirnameMatch =
        !modifyFilenameOptions?.dirnameReg ||
        modifyFilenameOptions?.dirnameReg.test(item.dir);
      const isIgnored =
        modifyFilenameOptions?.ignoreFilesPatterns?.some((pattern) =>
          pattern.test(item.filePath),
        ) ?? false;
      return isFilenameMatch && isExtnameMatch && isDirnameMatch && !isIgnored;
    });
    return targetList;
  };

  /**
   * 批量预览修改文件名的效果。
   * 此方法根据提供的修改文件名选项，对一批文件进行预处理，展示出如果按照这些选项修改，文件名将会发生什么变化。
   * 这对于在实际修改前确认修改效果非常有用，避免了潜在的错误或不期望的变更。
   *
   * @param modifyFilenameOptions 包含用于修改文件名的各种选项的对象。
   * @returns 返回一个数组，其中每个元素都包含了原始文件名和拟修改后的文件名的详细比较。
   */
  execModifyFileNamesBatchPreview = (
    modifyFilenameOptions: ModifyFilenameOptions,
  ): PriviewResultReturnType => {
    const targetList = this.execModifyFileNamesBatchQuery(
      modifyFilenameOptions,
    );
    const filePathListSet = new Set(this.fsInstance.filePathList);
    const replaceResult = targetList.map((item) => {
      let newFilename =
        modifyFilenameOptions.filenameReg && modifyFilenameOptions.filename
          ? item.name.replace(
              modifyFilenameOptions.filenameReg,
              modifyFilenameOptions.filename,
            )
          : item.name;
      let newExtname =
        modifyFilenameOptions.extnameReg && modifyFilenameOptions.extname
          ? item.ext.replace(
              modifyFilenameOptions.extnameReg,
              modifyFilenameOptions.extname,
            )
          : item.ext;
      const newDirname =
        modifyFilenameOptions.dirnameReg && modifyFilenameOptions.dirname
          ? item.dir.replace(
              modifyFilenameOptions.dirnameReg,
              modifyFilenameOptions.dirname,
            )
          : item.dir;
      newExtname = this.ensureExtname(newExtname);
      if (modifyFilenameOptions.addTimeStamp) {
        const timeStamp = Date.now();
        const randomString = generateSimpleRandomString();
        newFilename += `_${timeStamp}_${randomString}`;
      }
      if (modifyFilenameOptions.addDateTime) {
        const dateTime = getFormattedTimestamp();
        const randomString = generateSimpleRandomString();
        newFilename += `_${dateTime}_${randomString}`;
      }
      let newFilePath = path.format({
        dir: newDirname,
        name: newFilename,
        ext: newExtname,
      });
      newFilePath = generateUniquePathWithoutFs(newFilePath, filePathListSet);
      filePathListSet.add(newFilePath);
      return {
        oldFilePath: item.filePath,
        newFilePath,
        isChange: item.filePath !== newFilePath,
      };
    });
    return {
      changeCount: replaceResult.length,
      changeRecords: replaceResult,
    };
  };
  /**
   * 批量修改文件名的执行函数。
   *
   * @param modifyFilenameOptions 修改文件名的选项对象，包含文件名、扩展名和目录名的正则表达式和替换值。
   * @returns 返回一个对象，包含修改的文件数量和修改记录。
   */
  async execModifyFileNamesBatch(
    modifyFilenameOptions: ModifyFilenameOptions,
  ): Promise<ModifyResultReturnType> {
    const changeRecords: ModifyResult[] = [];
    let changeCount = 0;
    const targetList = this.execModifyFileNamesBatchQuery(
      modifyFilenameOptions,
    );
    const filePathListSet = new Set(this.fsInstance.filePathList);
    // 使用 map 创建一个包含所有异步操作的 Promise 数组
    const promises = targetList.map(async (fileInfo) => {
      let newFilename =
        modifyFilenameOptions.filenameReg && modifyFilenameOptions.filename
          ? fileInfo.name.replace(
              modifyFilenameOptions.filenameReg,
              modifyFilenameOptions.filename,
            )
          : fileInfo.name;
      let newExtname =
        modifyFilenameOptions.extnameReg && modifyFilenameOptions.extname
          ? fileInfo.ext.replace(
              modifyFilenameOptions.extnameReg,
              modifyFilenameOptions.extname,
            )
          : fileInfo.ext;
      const newDirname =
        modifyFilenameOptions.dirnameReg && modifyFilenameOptions.dirname
          ? fileInfo.dir.replace(
              modifyFilenameOptions.dirnameReg,
              modifyFilenameOptions.dirname,
            )
          : fileInfo.dir;
      newExtname = this.ensureExtname(newExtname);
      if (modifyFilenameOptions.addTimeStamp) {
        const timeStamp = Date.now();
        const randomString = generateSimpleRandomString();
        newFilename += `_${timeStamp}_${randomString}`;
      }
      if (modifyFilenameOptions.addDateTime) {
        const dateTime = getFormattedTimestamp();
        const randomString = generateSimpleRandomString();
        newFilename += `_${dateTime}_${randomString}`;
      }
      let newFilePath = path.format({
        dir: newDirname,
        name: newFilename,
        ext: newExtname,
      });
      newFilePath = generateUniquePathWithoutFs(newFilePath, filePathListSet);
      filePathListSet.add(newFilePath);
      try {
        const { isChange, uniqueNewFilePath } =
          await this.fsInstance.renameFile(fileInfo.filePath, newFilePath);
        if (isChange) {
          changeRecords.push({
            oldFilePath: fileInfo.filePath,
            newFilePath: uniqueNewFilePath,
          });
          changeCount++;
        }
      } catch (error) {
        Logger.getInstance().error(
          `重命名文件失败：${fileInfo.filePath} -> ${newFilePath}`,
          error,
        );
      }
    });
    // 等待所有的 Promise 完成
    await Promise.all(promises);
    return {
      changeCount,
      changeRecords,
    };
  }

  /**
   * 此方法根据提供的自定义选项逐个修改文件名，并记录修改结果。
   * 它首先根据选项查询需要修改的文件列表，然后对每个文件应用自定义的文件名、扩展名和目录名修改逻辑。
   * 如果修改成功，它会记录变更，并增加修改计数；如果修改失败，它会打印错误信息。
   *
   * @param modifyFilenameCustomOptions 修改文件名的自定义选项，包括自定义文件名、扩展名和目录名的函数。
   * @returns 返回一个对象，包含修改计数和变更记录列表。
   */
  async execModifyFileNamesBatchCustom(
    modifyFilenameCustomOptions: ModifyFilenameOptions,
  ): Promise<ModifyResultReturnType> {
    const changeRecords: ModifyResult[] = [];
    let changeCount = 0;
    const targetList = this.execModifyFileNamesBatchQuery(
      modifyFilenameCustomOptions,
    );

    // 使用 map 创建一个包含所有异步操作的 Promise 数组
    const promises = targetList.map(async (fileInfo) => {
      const newFilename = modifyFilenameCustomOptions.customFilename
        ? modifyFilenameCustomOptions.customFilename(fileInfo.name)
        : fileInfo.name;
      let newExtname = modifyFilenameCustomOptions.customExtname
        ? modifyFilenameCustomOptions.customExtname(fileInfo.ext)
        : fileInfo.ext;
      const newDirname = modifyFilenameCustomOptions.customDirname
        ? modifyFilenameCustomOptions.customDirname(fileInfo.dir)
        : fileInfo.dir;
      newExtname = this.ensureExtname(newExtname); // 假设这是同步函数

      const newFilePath = path.format({
        dir: newDirname,
        name: newFilename,
        ext: newExtname,
      });
      try {
        const { isChange, uniqueNewFilePath } =
          await this.fsInstance.renameFile(fileInfo.filePath, newFilePath);
        if (isChange) {
          changeRecords.push({
            oldFilePath: fileInfo.filePath,
            newFilePath: uniqueNewFilePath,
          });
          changeCount++;
        }
      } catch (error) {
        Logger.getInstance().error(
          `重命名文件失败：${fileInfo.filePath} -> ${newFilePath}`,
          error,
        );
      }
    });

    // 等待所有的异步操作完成
    await Promise.all(promises);

    // 所有操作完成后返回结果
    return {
      changeCount,
      changeRecords,
    };
  }
}
export const createModifyFilenameExec = async (
  dir: string,
  mode: "preview" | "exec" | "custom",
  modifyFilenameOptions: ModifyFilenameOptions,
  isUseIgnoredFiles: boolean,
) => {
  const exec = new Exec(dir, isUseIgnoredFiles);
  if (mode === "preview") {
    return exec.execModifyFileNamesBatchPreview(modifyFilenameOptions);
  } else if (mode === "exec") {
    return await exec.execModifyFileNamesBatch(modifyFilenameOptions);
  } else if (mode === "custom") {
    return await exec.execModifyFileNamesBatchCustom(modifyFilenameOptions);
  }
};
