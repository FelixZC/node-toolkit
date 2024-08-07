import { dialog, ipcMain, shell } from "electron";
import { Logger } from "../utils/log";
import { readFile } from "../utils/fs";
export default function mainWindowHandleEvents() {
  ipcMain.handle("choose-directory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    return result.filePaths;
  });

  // 假设所有exec函数都接受一个额外的isUseIgnoredFiles参数
  ipcMain.handle(
    "exec-babel",
    async (
      event,
      dir: string,
      babelPluginPathList: string[],
      isUseIgnoredFiles: boolean,
    ) => {
      const { execBabelPlugin } = await import("../exec/exec-babel-plugin");
      await execBabelPlugin(dir, babelPluginPathList, isUseIgnoredFiles);
    },
  );
  ipcMain.handle(
    "exec-jscodemod",
    async (
      event,
      dir: string,
      jscodemodeList: string[],
      isUseIgnoredFiles: boolean,
    ) => {
      const { execJSCodemods } = await import("../exec/exec-jscodemod");
      await execJSCodemods(dir, jscodemodeList, isUseIgnoredFiles);
    },
  );
  ipcMain.handle(
    "exec-posthtml",
    async (
      event,
      dir: string,
      posthtmlPluginPathList: string[],
      isUseIgnoredFiles: boolean,
    ) => {
      const { execPosthtmlPlugins } = await import(
        "../exec/exec-posthtml-plugin"
      );
      await execPosthtmlPlugins(dir, posthtmlPluginPathList, isUseIgnoredFiles);
    },
  );
  ipcMain.handle(
    "exec-postcss",
    async (
      event,
      dir: string,
      postcssPluginPathList: string[],
      isUseIgnoredFiles: boolean,
    ) => {
      const { execPostcssPlugins } = await import(
        "../exec/exec-postcss-plugin"
      );
      await execPostcssPlugins(dir, postcssPluginPathList, isUseIgnoredFiles);
    },
  );
  ipcMain.handle(
    "exec-file-statistical",
    async (event, dir: string, isUseIgnoredFiles: boolean) => {
      const { createFileStatisticalExec } = await import(
        "../exec/exec-file-statistical"
      );
      return await createFileStatisticalExec(dir, "tree", isUseIgnoredFiles);
    },
  );
  ipcMain.handle(
    "exec-get-attrs-and-annotation",
    async (event, dir: string, isUseIgnoredFiles: boolean) => {
      const { getAttrsAndAnnotation } = await import(
        "../exec/exec-get-attrs-and-annotation"
      );
      return await getAttrsAndAnnotation(dir, isUseIgnoredFiles);
    },
  );
  ipcMain.handle(
    "exec-modify-file-names-batch-priview",
    async (
      event,
      dir: string,
      modifyFilenameOptions,
      isUseIgnoredFiles: boolean,
    ) => {
      const { createModifyFilenameExec } = await import(
        "../exec/exec-modify-file-names-batch"
      );
      return await createModifyFilenameExec(
        dir,
        "preview",
        modifyFilenameOptions,
        isUseIgnoredFiles,
      );
    },
  );
  ipcMain.handle(
    "exec-modify-file-names-batch",
    async (
      event,
      dir: string,
      modifyFilenameOptions,
      isUseIgnoredFiles: boolean,
    ) => {
      const { createModifyFilenameExec } = await import(
        "../exec/exec-modify-file-names-batch"
      );
      return await createModifyFilenameExec(
        dir,
        "exec",
        modifyFilenameOptions,
        isUseIgnoredFiles,
      );
    },
  );
  ipcMain.handle(
    "exec-reg-query-batch",
    async (
      event,
      dir: string,
      queryReg: RegExp,
      ignoreReg: RegExp[],
      isAddSourcePath: boolean,
      isUseIgnoredFiles: boolean,
    ) => {
      const { execRegQueryBatch } = await import(
        "../exec/exec-reg-query-batch"
      );
      return await execRegQueryBatch(
        dir,
        isUseIgnoredFiles,
        queryReg,
        isAddSourcePath,
        ignoreReg,
      );
    },
  );
  ipcMain.handle(
    "get-dir-and-file-info",
    async (event, dir: string, isUseIgnoredFiles: boolean) => {
      const { getDirAndFileInfo } = await import("../file-manage/index");
      return await getDirAndFileInfo(dir, isUseIgnoredFiles);
    },
  );
  ipcMain.handle("read-file", async (event, filePath: string) => {
    const content = await readFile(filePath);
    return content;
  });
  ipcMain.handle("open-file", async (event, filePath: string) => {
    try {
      await shell.openPath(filePath);
    } catch (error) {
      Logger.getInstance().error(error);
      dialog.showMessageBox({
        type: "error",
        message: "Error opening file",
        buttons: ["OK"],
      });
    }
  });
}
