import { declare } from "@babel/helper-plugin-utils";
import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
/**
 * 主要用于转换和移除JavaScript代码中的console相关调用。
 * 该插件会在编译时移除指定的console方法调用，或者将它们替换为无操作函数。
 *
 * @param babel Babel环境的上下文对象，用于访问Babel的功能和API。
 * @return 返回一个Babel插件对象，包含处理CallExpression和MemberExpression的逻辑。
 */
export default declare((babel) => {
  /**
   * 判断给定的节点路径是否表示全局console标识符。
   *
   * @param id 节点路径，预期为一个标识符。
   * @return 如果节点是全局console标识符且作用域中没有绑定，则返回true；否则返回false。
   */
  function isGlobalConsoleId(id: NodePath) {
    const name = "console";
    return (
      id.isIdentifier({
        name,
      }) &&
      !id.scope.getBinding(name) &&
      id.scope.hasGlobal(name)
    );
  }

  /**
   * 判断给定的属性是否被排除数组中的某个名称排除。
   *
   * @param property 节点路径，可以是PrivateName或Expression。
   * @param excludeArray 一个字符串数组，包含要排除的属性名。
   * @return 如果属性名在排除数组中，则返回true；否则返回false。
   */
  function isExcluded(
    property: NodePath<t.PrivateName | t.Expression>,
    excludeArray: string[] = [],
  ) {
    return (
      excludeArray &&
      excludeArray.some((name) =>
        property.isIdentifier({
          name,
        }),
      )
    );
  }

  /**
   * 判断成员表达式是否是指向全局console的方法调用。
   *
   * @param memberExpr 成员表达式的节点路径。
   * @param excludeArray 一个字符串数组，包含要排除的方法名。
   * @return 如果成员表达式表示全局console的方法调用且不在排除数组中，则返回true；否则返回false。
   */
  function isIncludedConsole(
    memberExpr: NodePath<t.MemberExpression>,
    excludeArray: string[] = [],
  ) {
    const object = memberExpr.get("object");
    const property = memberExpr.get("property");
    if (isExcluded(property, excludeArray)) return false;
    if (isGlobalConsoleId(object)) return true;
    return (
      //@ts-ignore
      isGlobalConsoleId(object.get("object")) &&
      (property.isIdentifier({
        name: "call",
      }) ||
        property.isIdentifier({
          name: "apply",
        }))
    );
  }

  /**
   * 判断成员表达式是否是指向全局console的bind调用。
   *
   * @param memberExpr 成员表达式的节点路径。
   * @param excludeArray 一个字符串数组，包含要排除的方法名。
   * @return 如果成员表达式表示全局console的bind调用且不在排除数组中，则返回true；否则返回false。
   */
  function isIncludedConsoleBind(
    memberExpr: NodePath<t.MemberExpression>,
    excludeArray: string[] = [],
  ) {
    const object = memberExpr.get("object");
    if (!object.isMemberExpression()) return false;
    if (isExcluded(object.get("property"), excludeArray)) return false;
    return (
      isGlobalConsoleId(object.get("object")) &&
      memberExpr.get("property").isIdentifier({
        name: "bind",
      })
    );
  }

  /**
   * 创建一个无操作的函数表达式。
   *
   * @return 返回一个表示无操作的空函数表达式节点。
   */
  function createNoop() {
    return t.functionExpression(null, [], t.blockStatement([]));
  }

  /**
   * 创建一个返回void 0的表达式节点。
   *
   * @return 返回一个表示`void 0`的unaryExpression节点。
   */
  function createVoid0() {
    return t.unaryExpression("void", t.numericLiteral(0));
  }

  // 返回Babel插件对象
  return {
    name: "transform-remove-console",
    visitor: {
      CallExpression(path, state) {
        const callee = path.get("callee");
        if (!callee.isMemberExpression()) return;

        // 移除或替换符合条件的console调用
        if (
          isIncludedConsole(
            callee,
            (state?.opts as Record<string, any>)?.exclude,
          )
        ) {
          if (path.parentPath.isExpressionStatement()) {
            path.remove();
          } else {
            path.replaceWith(createVoid0());
          }
        } else if (
          isIncludedConsoleBind(
            callee,
            (state?.opts as Record<string, any>)?.exclude,
          )
        ) {
          path.replaceWith(createNoop());
        }
      },
      MemberExpression: {
        exit(path, state) {
          // 移除或替换符合条件的console属性
          if (
            isIncludedConsole(
              path,
              (state?.opts as Record<string, any>)?.exclude,
            ) &&
            !path.parentPath.isMemberExpression()
          ) {
            if (
              path.parentPath.isAssignmentExpression() &&
              path.parentKey === "left"
            ) {
              path.parentPath.get("right").replaceWith(createNoop());
            } else {
              path.replaceWith(createNoop());
            }
          }
        },
      },
    },
  };
});
