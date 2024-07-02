//@ts-nocheck
import { Transform } from "jscodeshift";
/**
 * 使用jscodeshift转换器工具包来转换JS代码，主要用于移除Object.assign的调用。
 *
 * @param file 包含要转换的源代码的文件对象。
 * @param api 提供jscodeshift实例和其他实用工具的API对象。
 * @param options 包含转换选项的对象，例如打印选项。
 * @return 返回转换后的源代码字符串。
 */
const transformer: Transform = (file, api, options) => {
  const j = api.jscodeshift;
  // 设置或默认打印选项
  const printOptions = options.printOptions || {
    quote: "single",
  };
  // 创建根节点以开始AST遍历和转换
  const root = j(file.source);

  /**
   * 替换Object.assign调用的函数。
   *
   * @param path Object.assign调用的路径对象。
   */
  const rmObjectAssignCall = (path) =>
    j(path).replaceWith(
      j.objectExpression(
        // 将Object.assign的参数合并为一个对象表达式
        path.value.arguments.reduce(
          (allProperties, { comments, ...argument }) => {
            if (argument.type === "ObjectExpression") {
              const { properties } = argument; // 复制注释

              // 如果存在注释，则将第一个属性的注释与当前注释合并
              if (properties.length > 0 && comments && comments.length > 0) {
                properties[0].comments = [
                  ...(properties[0].comments || []),
                  ...(comments || []),
                ];
              }
              return [...allProperties, ...properties];
            }

            // 对于非对象表达式的参数，使用spreadProperty来保持它们
            return [
              ...allProperties,
              {
                ...j.spreadProperty(argument),
                comments,
              },
            ];
          },
          [],
        ),
      ),
    );

  // 查找并处理所有Object.assign调用
  root
    .find(j.CallExpression, {
      arguments: [
        {
          type: "ObjectExpression",
        },
      ],
      callee: {
        object: {
          name: "Object",
        },
        property: {
          name: "assign",
        },
      },
    })
    // 过滤掉包含spread元素的调用
    .filter((p) => !p.value.arguments.some((a) => a.type === "SpreadElement"))
    // 对剩余的调用应用rmObjectAssignCall函数
    .forEach(rmObjectAssignCall);
  // 返回转换后的源代码
  return root.toSource(printOptions);
};
export default transformer;
