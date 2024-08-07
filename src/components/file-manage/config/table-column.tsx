import FileManageContext from "../context";
import { formatFileSize } from "@src/utils/common";
import React, { useContext } from "react";
import type { FileInfoCustom } from "@src/types/file";
import type { TableColumnsType } from "antd";
const getTabelColumn = () => {
  const context = useContext(FileManageContext);
  if (!context) {
    throw new Error("useContext must be inside a FileManageContext.Provider");
  }
  const { sortConfig } = context;
  const getSort = (field: string) => {
    const localSortConfig = Array.isArray(sortConfig)
      ? sortConfig
      : [sortConfig];
    const sortIndex = localSortConfig.findIndex((item) => item.field === field);
    if (sortIndex !== -1) {
      return localSortConfig[sortIndex].order;
    } else {
      return null;
    }
  };
  const columns: TableColumnsType<FileInfoCustom> = [
    {
      title: "名称",
      dataIndex: "base",
      key: "base",
      width: 200,
      render: (text, record) => {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={record.fileIcon}
              alt="icon"
              style={{
                width: 24,
                height: 24,
                marginRight: 8,
              }}
            />
            <span>{text}</span>
          </div>
        );
      },
      sorter: true,
      sortOrder: getSort("base"),
    },
    {
      title: (props) => {
        return (
          <div style={{ minWidth: 300 }}>
            <span>文件路径</span>
          </div>
        );
      },
      dataIndex: "filePath",
      key: "filePath",
      sorter: true,
      sortOrder: getSort("filePath"),
      render: (text, record) => {
        return (
          <div style={{ minWidth: 300 }}>
            <span>{text}</span>
          </div>
        );
      },
    },
    {
      title: "文件大小",
      dataIndex: "size",
      key: "size",
      width: 100,
      sorter: true,
      sortOrder: getSort("size"),
      render: (text, record) => {
        const result =
          record.type === "Folder" ? "" : formatFileSize(record.size);
        return (
          <div>
            <span>{result}</span>
          </div>
        );
      },
    },
    {
      title: "修改时间",
      dataIndex: "mtimeFormat",
      key: "mtimeFormat",
      width: 150,
      sorter: true,
      sortOrder: getSort("mtimeFormat"),
    },
  ];
  return columns;
};
export default getTabelColumn;
