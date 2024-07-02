import { declare } from "@babel/helper-plugin-utils";
import { getImportInfo } from "./ast-utils";
import * as t from "@babel/types";

/**
 * 导入排序
 * 声明一个自定义的AST（抽象语法树）转换函数
 * @param babel Babel对象，提供转换所需的上下文和工具
 * @returns 返回一个描述AST转换规则的对象
 */
export default declare((babel) => {
  /**
   * 对导入声明列表进行排序
   * @param importList 导入声明数组
   */
  const sortImport = (importList: t.ImportDeclaration[]) => {
    /** 先对导入导出名称进行排序 */
    importList.forEach((importItem) => {
      importItem.specifiers.sort((v1, v2) => {
        let v1Name = v1.local.name;
        let v2Name = v2.local.name;

        // 对默认导入或命名空间导入进行特殊处理
        if (
          t.isImportDefaultSpecifier(v1) ||
          t.isImportNamespaceSpecifier(v1)
        ) {
          return -1;
        }
        if (
          t.isImportDefaultSpecifier(v2) ||
          t.isImportNamespaceSpecifier(v2)
        ) {
          return 1;
        }

        // 对具名导入进行处理，获取导入名称
        if (t.isImportSpecifier(v1)) {
          if (t.isIdentifier(v1.imported)) {
            v1Name = v1.imported.name;
          } else {
            v1Name = v1.imported.value;
          }
        }
        if (t.isImportSpecifier(v2)) {
          if (t.isIdentifier(v2.imported)) {
            v2Name = v2.imported.name;
          } else {
            v2Name = v2.imported.value;
          }
        }
        return v1Name.localeCompare(v2Name);
      });
    });

    // 生成并处理导入信息列表
    const importInfoList = importList.map((importItem) => {
      return getImportInfo(importItem);
    });

    // 对导入声明列表整体进行排序
    importList.sort((v1, v2) => {
      const v1ImportInfo = importInfoList.find(
        (importObjList) => importObjList[0]?.source === v1?.source?.value,
      );
      const v2ImportInfo = importInfoList.find(
        (importObjList) => importObjList[0]?.source === v2?.source?.value,
      );
      if (!v1ImportInfo || !v2ImportInfo) {
        return 0;
      }
      let v1Name = "@";
      let v2Name = "@";

      // 如果存在默认导入，按默认导入排序
      if (v1ImportInfo.length > 1) {
        const target = v1ImportInfo.find((item) => item.importedName);
        if (target) {
          v1Name = target.importedName!;
        }
      }
      if (v2ImportInfo.length > 1) {
        const target = v2ImportInfo.find((item) => item.importedName);
        if (target) {
          v2Name = target.importedName!;
        }
      }

      // 按本地名称排序
      v1Name = v1ImportInfo[0].localName;
      v2Name = v2ImportInfo[0].localName;
      return v1Name.localeCompare(v2Name);
    });
  };

  // 返回定义的AST转换规则
  return {
    name: "ast-transform",
    visitor: {
      Program: {
        exit(path) {
          try {
            const typeImportList: t.ImportDeclaration[] = [];
            const normalImportList: t.ImportDeclaration[] = [];
            const statementList: t.Statement[] = [];
            /** 分类程序中的导入声明和其他语句 */
            path.node.body.forEach((item) => {
              if (t.isImportDeclaration(item)) {
                if (item.importKind === "type") {
                  typeImportList.push(item);
                } else {
                  normalImportList.push(item);
                }
              } else {
                statementList.push(item);
              }
            });

            // 对正常导入和类型导入分别进行排序
            sortImport(normalImportList);
            sortImport(typeImportList);

            // 更新程序体，按排序后的顺序合并导入声明和其他语句
            path.node.body = [
              ...normalImportList,
              ...typeImportList,
              ...statementList,
            ];
          } catch (e) {
            throw e;
          }
        },
      },
    },
  };
});
