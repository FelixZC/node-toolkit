// FileManageContext.ts
import React from "react";
import type { FileInfoCustom } from "@src/types/file";
import type { TableProps } from "antd";
import type { SortConfigType } from "./index";
interface FileManageContextType {
  currentRow: FileInfoCustom | null;
  showData: FileInfoCustom[];
  isUsePreview: boolean;
  sortConfig: SortConfigType;
  lockOrder: "ascend" | "descend";
  hideMenu: () => void;
  onRowClick: (
    e: React.MouseEvent<HTMLDivElement>,
    record: FileInfoCustom,
  ) => void;
  onDoubleClick: (
    e: React.MouseEvent<HTMLDivElement>,
    record: FileInfoCustom,
  ) => void;
  onContextMenu: (
    e: React.MouseEvent<HTMLDivElement>,
    record?: FileInfoCustom,
  ) => void;
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
  setIsUsePreview: React.Dispatch<React.SetStateAction<boolean>>;
  tableChange: TableProps<FileInfoCustom>["onChange"];
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfigType>>;
  setLockOrder: React.Dispatch<React.SetStateAction<"ascend" | "descend">>;
}
const FileManageContext = React.createContext<
  FileManageContextType | undefined
>(undefined);
export default FileManageContext;
