import React from "react";
import { copyTextToClipboard } from "@src/utils/common";
import FileManageContext from "../context";
import { message } from "antd";
import type { MenuProps } from "antd";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useContext } from "react";
const getMenus = () => {
  const context = useContext(FileManageContext);
  if (!context) {
    throw new Error("useContext must be inside a FileManageContext.Provider");
  }
  const {
    currentRow,
    setCurrentView,
    isUsePreview,
    hideMenu,
    setIsUsePreview,
    sortConfig,
    setSortConfig,
    lockOrder,
    setLockOrder,
  } = context;

  const getSortIcon = (field: string) => {
    const localSortConfig = Array.isArray(sortConfig)
      ? sortConfig
      : [sortConfig];
    const sortItem = localSortConfig.find((item) => item.field === field);
    if (sortItem) {
      if (sortItem.order === "ascend") {
        return <SortAscendingOutlined />;
      } else if (sortItem.order === "descend") {
        return <SortDescendingOutlined />;
      } else {
        return null;
      }
    }
    return null;
  };
  /**
   * 不搞多列排序烧脑，简简单单才是真
   * 非要搞的话，先把lockOrder去掉
   * @param field 要更新或添加的排序字段名。
   */
  const changeSortConfig = (field: string) => {
    const localSortConfig = Array.isArray(sortConfig)
      ? [...sortConfig]
      : [sortConfig];
    const sortItemIndex = localSortConfig.findIndex(
      (item) => item.field === field,
    );
    if (sortItemIndex !== -1) {
      const sortItem = localSortConfig[sortItemIndex];
      sortItem.order = sortItem.order === lockOrder ? null : lockOrder;
      setSortConfig(localSortConfig);
    } else {
      setSortConfig([
        {
          field,
          order: lockOrder,
        },
      ]);
    }
  };

  const revertSortConfig = () => {
    const localSortConfig = Array.isArray(sortConfig)
      ? [...sortConfig]
      : [sortConfig];
    localSortConfig.forEach((item) => {
      item.order =
        item.order === "ascend"
          ? "descend"
          : item.order === "descend"
            ? "ascend"
            : null;
    });
    setSortConfig(localSortConfig);
  };

  const menuStyle: React.CSSProperties = {};
  const menus: MenuProps = {
    mode: "vertical",
    items: [
      {
        key: "view",
        type: "submenu",
        label: "视图切换",
        style: menuStyle,
        children: [
          {
            key: "large-icon",
            label: "大图标",
            type: "item",
            style: menuStyle,
            onClick: () => {
              setCurrentView("large-icon");
            },
          },
          {
            key: "medium-icon",
            label: "中等图标",
            type: "item",
            style: menuStyle,
            onClick: () => {
              setCurrentView("medium-icon");
            },
          },
          {
            key: "small-icon",
            label: "小图标",
            type: "item",
            style: menuStyle,
            onClick: () => {
              setCurrentView("small-icon");
            },
          },
          {
            key: "detail",
            label: "详情",
            type: "item",
            style: menuStyle,
            onClick: () => {
              setCurrentView("detail");
            },
          },
          {
            key: "preview",
            type: "item",
            label: isUsePreview ? "关闭预览" : "开启预览",
            style: menuStyle,
            onClick: () => {
              setIsUsePreview(!isUsePreview);
            },
          },
        ],
      },
      {
        key: "sort",
        type: "submenu",
        style: menuStyle,
        label: "排序",
        children: [
          {
            icon: getSortIcon("base"),
            key: "base",
            label: "名称",
            style: menuStyle,
            type: "item",
            onClick: () => {
              changeSortConfig("base");
            },
          },
          {
            icon: getSortIcon("filePath"),
            key: "filePath",
            label: "路径",
            style: menuStyle,
            type: "item",
            onClick: () => {
              changeSortConfig("filePath");
            },
          },
          {
            icon: getSortIcon("size"),
            key: "size",
            label: "大小",
            style: menuStyle,
            type: "item",
            onClick: () => {
              changeSortConfig("size");
            },
          },
          {
            icon: getSortIcon("ext"),
            key: "ext",
            label: "扩展名",
            style: menuStyle,
            type: "item",
            onClick: () => {
              changeSortConfig("ext");
            },
          },
          {
            icon: getSortIcon("type"),
            key: "type",
            label: "类型",
            style: menuStyle,
            type: "item",
            onClick: () => {
              changeSortConfig("type");
            },
          },
          {
            icon: getSortIcon("mtimeFormat"),
            key: "mtimeFormat",
            label: "修改时间",
            style: menuStyle,
            type: "item",
            onClick: () => {
              changeSortConfig("mtimeFormat");
            },
          },
          {
            icon: getSortIcon("birthtime"),
            key: "birthtime",
            label: "创建时间",
            style: menuStyle,
            type: "item",
            onClick: () => {
              changeSortConfig("birthtime");
            },
          },
          {
            icon: getSortIcon("atime"),
            key: "atime",
            label: "最后访问时间",
            style: menuStyle,
            type: "item",
            onClick: () => {
              changeSortConfig("atime");
            },
          },
          // {
          //   icon: getSortIcon('ctime'),
          //   key: 'ctime',
          //   label: '元数据最后改变时间',
          // style: menuStyle,
          //   type: 'item',
          //   onClick: () => {
          //     changeSortConfig('ctime')
          //   },
          // },
          { type: "divider" },
          {
            icon: lockOrder === "ascend" ? <CheckOutlined /> : null,
            key: "lockAscend",
            type: "item",
            style: menuStyle,
            label: "升序",
            onClick: () => {
              setLockOrder("ascend");
              revertSortConfig();
            },
          },
          {
            icon: lockOrder === "descend" ? <CheckOutlined /> : null,
            key: "lockDescend",
            type: "item",
            style: menuStyle,
            label: "降序",
            onClick: () => {
              setLockOrder("descend");
              revertSortConfig();
            },
          },
        ],
      },
      {
        key: "copy",
        type: "item",
        style: menuStyle,
        label: "复制路径",
        onClick: async () => {
          if (currentRow) {
            await copyTextToClipboard(currentRow.filePath);
          } else {
            message.error("请选择文件");
          }
          hideMenu();
        },
      },
    ],
  };
  return menus;
};
export default getMenus;
