import * as path from "path";
import { transferRef } from "../utils/common";
import { execBabelPlugin } from "./exec-babel-plugin";
import { execPostcssPlugins } from "./exec-postcss-plugin";
import { execPosthtmlPlugins } from "./exec-posthtml-plugin";
import { createModifyFilenameExec } from "./exec-modify-file-names-batch";

/**
 * 不常用，不优化，总共读取了四次路径
 * 批量修改文件命名和引用为驼峰式规范
 * 执行批处理操作，包括使用babel、postcss和posthtml插件转换文件名和引用，
 * 以及修改文件名和目录名以符合驼峰式规范。
 */
export async function execTransferFileNameToKebabCase() {
  const dir = path.join("src copy");
  // 定义babel插件路径列表，用于加载插件
  const babelPluginPathList: string[] = [
    "../plugins/babel-plugins/transfer-file-name-tok-kebab-case",
  ];
  await execBabelPlugin(dir, babelPluginPathList, true);

  // 定义postcss插件路径列表，用于加载插件
  const postcssPluginsPathList: string[] = [
    "../plugins/postcss-plugins/transfer-file-name-tok-kebab-case",
  ];

  await execPostcssPlugins(dir, postcssPluginsPathList, true);

  // 定义posthtml插件路径列表，用于加载插件
  const posthtmlPluginsPathList: string[] = [
    "../plugins/posthtml-plugins/transfer-file-name-tok-kebab-case",
  ];

  await execPosthtmlPlugins(dir, posthtmlPluginsPathList, true);
  // 定义文件名转换函数，将文件名从其他格式转换为驼峰式
  const customFilename = (oldFilename: string) => {
    return transferRef(oldFilename, "\\");
  };

  // 定义目录名转换函数，将目录名从其他格式转换为驼峰式
  const customDirname = (oldDirname: string) => {
    const relativeDir = path.relative(process.cwd(), oldDirname);
    return transferRef(relativeDir, "\\");
  };

  await createModifyFilenameExec(
    dir,
    "custom",
    {
      customFilename,
      customDirname,
      addTimeStamp: false,
      addDateTime: false,
    },
    true,
  );
}
