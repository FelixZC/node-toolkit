/**
 * 属性键值排序
 */
import { sortObjAttr } from "../../utils/common";
import type PostHTML from "posthtml";
/**
 * 对PostHTML树中的节点属性进行排序。
 *
 * @param tree - PostHTML树，表示HTML文档的抽象结构。
 * @returns 返回经过属性排序后的PostHTML树。
 */
const propertySort: PostHTML.Plugin<unknown> = (tree) => {
  // 遍历PostHTML树的每一个节点
  tree.walk((node) => {
    // 当前节点有属性时进行处理
    if (node.attrs) {
      // 分别用于存储指令属性、引用属性、方法属性和普通属性
      const directiveAttrs: typeof node.attrs = {};
      const refAttrs: typeof node.attrs = {};
      const methodAttrs: typeof node.attrs = {};
      const normalAttrs: typeof node.attrs = {};

      // 为确保每个属性值非空，空值用特殊标识符'_pzc_'替代
      for (const key in node.attrs) {
        if (Object.prototype.hasOwnProperty.call(node.attrs, key)) {
          if (!node.attrs[key]) {
            node.attrs[key] = "_pzc_";
          }
        }
      }

      // 将节点属性分类到不同的对象中
      for (const [key, value] of Object.entries(node.attrs)) {
        switch (true) {
          case key.startsWith("v-"):
            directiveAttrs[key] = value;
            break;
          case key.startsWith(":"):
            refAttrs[key] = value;
            break;
          case key.startsWith("@"):
            methodAttrs[key] = value;
            break;
          default:
            normalAttrs[key] = value;
            break;
        }
      }

      // 对各类属性按键进行排序，并合并回原节点的属性对象
      node.attrs = {
        ...sortObjAttr(directiveAttrs),
        ...sortObjAttr(normalAttrs),
        ...sortObjAttr(refAttrs),
        ...sortObjAttr(methodAttrs),
      };
    }
    return node;
  });
};
export default propertySort;
