import path from "path";
import fsUtils, { readFile } from "../utils/fs";
import runBabelPlugin from "../plugins/use-babel-plugin";
import { logger } from "../utils/log";
import * as cliProgress from "../utils/cli-progress";
import { getMainWindow } from "../desktop/main-window";
import { Notification } from "electron";
import { groupBy } from "../utils/common";
import mdUtils from "../utils/md";
import type { ExecFileInfo } from "../types/common";
import type { BabelPlugin } from "../plugins/use-babel-plugin";

interface AttrsCollection {
  key: string | number;
  value: string | number;
  standingInitial?: string;
}

export const getAttrsAndAnnotation = async (
  dir: string,
  isUseIgnoredFiles: boolean,
) => {
  const fsInstance = new fsUtils(dir, isUseIgnoredFiles);
  const fileInfoList = fsInstance.getFileInfoList();
  // 定义使用到的babel插件列表
  const babelPluginPathList = ["../plugins/babel-plugins/extract-annotation"];

  // 将插件路径列表转换为插件对象列表
  const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
    const result = require(pluginPath);
    if (result.default) {
      return result.default;
    }
    return result;
  });
  const successList: string[] = []; // 执行改动文件列表
  const errorList: string[] = []; // 执行错误列表

  // 初始化存储属性信息的对象和数组
  const attrsCollectionTemp: AttrsCollection = {
    key: "",
    standingInitial: "a",
    value: "",
  };
  const attrsCollectionGroup: AttrsCollection[] = [];

  /**
   * 处理指定文件的属性信息。
   * @param filePath 文件路径
   */
  const handler = async (filePath: string) => {
    try {
      const content = await readFile(filePath);
      const execFileInfo: ExecFileInfo = {
        extra: {
          attributesObj: {},
        },
        path: filePath,
        source: content,
      }; // 不需要新内容

      runBabelPlugin(execFileInfo, plugins);
      const attributesObj = execFileInfo.extra!.attributesObj as Record<
        string,
        string
      >;
      const relativePosition = path.relative(process.cwd(), filePath);
      // 处理和收集属性信息
      if (Object.keys(attributesObj).length) {
        for (const [key, value] of Object.entries(attributesObj)) {
          // 冲突处理
          const newKey = `${key}->(${relativePosition})`;
          if (Reflect.get(attrsCollectionTemp, key)) {
            if (
              Reflect.get(attrsCollectionTemp, newKey) === value ||
              Reflect.get(attrsCollectionTemp, key) === value
            ) {
              continue;
            }
            Reflect.set(attrsCollectionTemp, newKey, value);
            attrsCollectionGroup.push({
              key: newKey,
              standingInitial: newKey.slice(0, 1).toLocaleUpperCase(),
              value,
            });
          } else {
            Reflect.set(attrsCollectionTemp, key, value);
            attrsCollectionGroup.push({
              key: newKey,
              standingInitial: key.slice(0, 1).toLocaleUpperCase(),
              value,
            });
          }
        }
      }
      successList.push(filePath);
    } catch (e) {
      logger.warn(e);
      errorList.push(filePath);
    }
  };
  const vaildList = [
    ".js",
    // JavaScript 文件
    ".jsx",
    // React JSX 文件
    ".ts",
    // TypeScript 文件
    ".tsx",
    // TypeScript JSX 文件
    ".mjs",
    // ES 模块 JavaScript 文件
    ".cjs",
    // CommonJS 模块 JavaScript 文件（通常不需要 Babel 处理，但可以配置）
    ".vue",
  ];
  const targetList = fileInfoList.filter((fileInfo) =>
    vaildList.includes(fileInfo.ext),
  );
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
      body: `共扫描${targetList.length}个文件，收集注释文件${targetList.length}个`,
    }).show();
  // 根据首字母对收集到的属性信息进行分组，并生成属性描述表格
  const attrsGroup = groupBy(attrsCollectionGroup, "standingInitial"); // 根据首字母排序

  let attributesDescriptionTable =
    mdUtils.createdAttributesGroupTable(attrsGroup); // 获取项目使用属性描述
  attributesDescriptionTable = attributesDescriptionTable
    .replace(/\{\{.*\}\}/g, "")
    .replace(/<.*>/g, "");
  return attributesDescriptionTable;
};
