//@ts-nocheck

import { Transform } from "jscodeshift";
/**
 * 使用jscodeshift进行代码转换的函数。
 * @param file 表示要转换的文件，包含文件源码。
 * @param api 提供jscodeshift实例和其他实用工具的对象。
 * @param options 包含转换选项的对象，例如打印选项。
 * @returns 返回转换后的文件源码字符串，如果没有进行任何转换则返回null。
 */
const transformer: Transform = (file, api, options) => {
  const { jscodeshift } = api;
  // 设置打印选项，默认使用单引号。
  const printOptions = options.printOptions || {
    quote: "single",
  };

  // 查找所有变量声明，并筛选出链式声明（即在一个声明中定义多个变量）且不在for语句中的变量。
  const chainedDeclarations = jscodeshift(file.source)
    .find(jscodeshift.VariableDeclaration)
    .filter(
      (variableDeclaration) =>
        variableDeclaration.value.declarations.length > 1,
    )
    .filter(
      (variableDeclaration) =>
        variableDeclaration.parent.value.type !== "ForStatement",
    );

  // 遍历每个链式声明，将其拆分为多个单独的声明。
  chainedDeclarations.forEach((chainedDeclaration) => {
    const { kind } = chainedDeclaration.value; // 提取变量声明的类型（如const、let或var）

    // 替换原链式声明为多个单独的声明。
    jscodeshift(chainedDeclaration).replaceWith(
      chainedDeclaration.value.declarations.map((declaration, i) => {
        const unchainedDeclaration = jscodeshift.variableDeclaration(kind, [
          declaration,
        ]);

        // 将注释分配给第一个声明，或如果存在，则将注释分配给当前声明。
        if (i === 0) {
          unchainedDeclaration.comments = chainedDeclaration.value.comments;
        } else if (declaration.comments) {
          unchainedDeclaration.comments = declaration.comments;
          declaration.comments = null;
        }
        return unchainedDeclaration;
      }),
    );
  });

  // 如果进行了转换，则返回转换后的源码；否则，返回null。
  return chainedDeclarations.size()
    ? chainedDeclarations.toSource(printOptions)
    : null;
};
export default transformer;
