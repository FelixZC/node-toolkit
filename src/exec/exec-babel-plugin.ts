import { createCliProgress } from "../utils/cli-progress";
import { fsUtils, readFile, writeFile } from "../utils/fs";
import { getMainWindow } from "../desktop/main-window";
import { Logger } from "../utils/log";
import { Notification } from "electron";
import path from "path";
import runBabelPlugin, { BabelPlugin } from "../plugins/use-babel-plugin";
import type { ExecFileInfo } from "../types/common";
export const execBabelPlugin = async (
  dir: string,
  babelPluginPathList: string[],
  isUseIgnoredFiles: boolean,
) => {
  const fsInstance = new fsUtils(dir, isUseIgnoredFiles);
  const fileInfoList = fsInstance.getFileInfoList();
  try {
    // 将插件路径列表映射为具体的插件实例数组
    const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
      const result = require(pluginPath); // 使用 require 加载插件

      // 确保 result.default 或 result 本身是 Babel 插件
      if (result.default && typeof result.default === "function") {
        return result.default;
      }
      return result;
    });
    const globalExtra: Record<string, any> = {}; // 用于存储全局额外信息的字典。
    const successList: string[] = []; // 执行改动文件列表
    const errorList: string[] = []; // 执行错误列表

    /**
     * 处理单个文件，应用Babel插件并更新文件内容。
     * @param filePath 文件路径。
     */
    const handler = async (filePath: string) => {
      try {
        const content = await readFile(filePath); // 读取文件内容。
        const execFileInfo: ExecFileInfo = {
          path: filePath,
          source: content,
          extra: {},
        };
        const newContent = runBabelPlugin(execFileInfo, plugins); // 应用Babel插件。

        // 如果文件信息中的额外信息非空，则存储到全局额外信息中。
        if (Object.keys(execFileInfo.extra!).length) {
          globalExtra[filePath] = execFileInfo.extra;
        }

        // 如果文件内容未改变或新内容为空，则不写入文件。
        if (newContent === content || !newContent.length) {
          return;
        }
        await writeFile(filePath, newContent); // 写入处理后的新内容。
        successList.push(filePath); // 添加到执行改动文件列表
      } catch (e) {
        Logger.getInstance().warn(e); // 捕获并警告处理过程中的任何错误。
        errorList.push(filePath); // 添加到执行错误列表
      }
    };
    const vaildList = [".js", ".jsx", ".ts", ".tsx", ".vue"]; // 定义有效文件扩展名列表。
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.ext),
    ); // 筛选出需要处理的文件列表。
    const { updateBar } = createCliProgress(targetList.length); // 初始化进度条。
    // 遍历所有有效文件，逐一处理，并更新进度条
    let count = 1;
    const mainWindow = getMainWindow();
    for (const item of targetList) {
      await handler(item.filePath);
      updateBar();
      mainWindow && mainWindow.setProgressBar(count++ / targetList.length);
    }
    mainWindow &&
      new Notification({
        title: "处理完成",
        body: `共扫描${targetList.length}个文件，执行改动文件${successList.length}个，执行失败文件${errorList.length}个`,
      }).show();
    return {
      successList,
      errorList,
    };
  } catch (e) {
    Logger.getInstance().warn("执行 Babel 插件时发生错误:", e);
  }
};
export function test() {
  const babelPluginPathList: string[] = [
    "../plugins/babel-plugins/merge-imports-plugin",
    "../plugins/babel-plugins/import-sort",
  ];
  execBabelPlugin(path.join("src"), babelPluginPathList, true);
}
test();
