import { logger } from "../utils/log";
import * as cliProgress from "../utils/cli-progress";
import fsUtils, { readFile, writeFile } from "../utils/fs";
import { getMainWindow } from "../desktop/main-window";
import { Notification } from "electron";
import runPosthtmlPlugin from "../plugins/use-posthtml-plugin";
import type { ExecFileInfo } from "../types/common";
import type { Plugin as PosthtmlPlugin } from "posthtml";
/**
 * 在给定目录下执行PostHTML插件。
 * 此函数负责加载并执行一系列PostHTML插件，这些插件由插件路径列表指定。
 * @param dir {string} - 工作目录的路径，插件将在该目录下执行。
 * @param pluginsPathList {string[]} - PostHTML插件的路径列表，每个路径都是一个Node.js模块的路径。
 */
export async function execPosthtmlPlugins(
  dir: string,
  pluginsPathList: string[],
  isUseIgnoredFiles: boolean,
) {
  const fsInstance = new fsUtils(dir, isUseIgnoredFiles);
  const fileInfoList = fsInstance.getFileInfoList();
  try {
    const plugins: PosthtmlPlugin<unknown>[] = pluginsPathList.map(
      (pluginPath) => {
        const result = require(pluginPath);
        if (result.default) {
          return result.default;
        }
        return result;
      },
    );
    /**
     * 执行PostHTML插件处理
     * @param plugins PostHTML插件数组，每个插件都是一个函数，接收一个对象作为参数，并返回处理后的结果
     * @returns 返回Promise，异步执行插件处理
     */
    // 用于存储所有文件处理过程中产生的额外全局信息
    const globalExtra: Record<string, any> = {};
    const successList: string[] = []; // 执行改动文件列表
    const errorList: string[] = []; // 执行错误列表
    // 处理单个文件的函数
    const handler = async (filePath: string) => {
      try {
        // 读取文件内容
        const content = await readFile(filePath);
        // 准备文件信息，包括额外信息、文件路径和源内容
        const execFileInfo: ExecFileInfo = {
          extra: {},
          path: filePath,
          source: content,
        };
        // 运行所有插件，对文件内容进行处理
        const result = await runPosthtmlPlugin(execFileInfo, plugins);
        // 移除处理结果中的特定占位符
        const newContent = result.replace(/=["]_pzc_["]/g, "");

        // 合并此文件处理过程产生的额外信息到全局额外信息中
        for (const key in execFileInfo.extra) {
          globalExtra[key] = execFileInfo.extra[key];
        }

        // 如果新内容与原内容相同或新内容为空，则不进行写入操作
        if (newContent === content || !newContent.length) {
          return;
        }

        // 写入处理后的内容到文件
        await writeFile(filePath, newContent);
        successList.push(filePath);
      } catch (e) {
        // 打印错误警告
        logger.warn(e);
        errorList.push(filePath);
      }
    };
    // 否则，处理项目中所有指定扩展名的文件
    const vaildList = [
      ".html",
      // HTML 文件
      ".htm",
      // HTML 文件的另一种常见后缀
      ".xml",
      // XML 文件
      ".phtml",
      // PHP 和 HTML 混合文件，通常用于 PHP 模板
      ".vue",
      // 其他可能的文件后缀，取决于插件的能力
    ];
    // 筛选出所有有效文件
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.ext),
    );
    // 初始化进度条，用于显示处理进度
    const { updateBar } = cliProgress.useCliProgress(targetList.length); // 初始化进度条。
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
    // 可以在这里添加更详细的错误处理逻辑
    logger.error("Error executing PostHTML plugins:", e);
  }
}
