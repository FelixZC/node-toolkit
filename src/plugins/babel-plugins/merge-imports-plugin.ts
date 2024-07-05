import { declare } from "@babel/helper-plugin-utils";
import { NodePath } from "@babel/core";
import * as t from "@babel/types";
export default declare((babel) => {
  let programPath: NodePath<t.Program>;
  return {
    visitor: {
      Program(path) {
        programPath = path;
      },
      ImportDeclaration(importPath) {
        // 存储所有导入声明的映射
        const importsMap = programPath.getData("importsMap") || {};
        const source = importPath.node.source.value;

        // 检查是否已经存在相同源的导入声明
        if (importsMap[source]) {
          // 合并导入
          const existingImport = importsMap[source];
          const newSpecifiers = importPath.node.specifiers;
          newSpecifiers.forEach((specifier) => {
            if (!existingImport.includes(specifier)) {
              existingImport.push(specifier);
            }
          });

          // 移除当前的重复导入声明
          importPath.remove();
        } else {
          // 记录新的导入声明
          importsMap[source] = importPath.node.specifiers;
        }

        // 更新Program节点的数据
        programPath.setData("importsMap", importsMap);
      },
    },
    post() {
      // 重新生成合并后的导入声明
      Object.keys(programPath.getData("importsMap")).forEach((source) => {
        const specifiers = programPath.getData("importsMap")[source];
        const importDeclaration = t.importDeclaration(
          specifiers,
          t.stringLiteral(source),
        );
        programPath.unshiftContainer("body", importDeclaration);
      });
    },
  };
});
