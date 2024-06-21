// FileManageContext.ts
import React from 'react'
import type { FileInfoCustom } from '@src/types/file'
import type { TableProps } from 'antd'
interface FileManageContextType {
  currentRow: FileInfoCustom | null
  filterResult: FileInfoCustom[]
  onRowClick: (e: React.MouseEvent<HTMLDivElement>, record: FileInfoCustom) => void
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>, record: FileInfoCustom) => void
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>, record?: FileInfoCustom) => void
  isUsePreview: boolean
  setCurrentView: React.Dispatch<React.SetStateAction<string>>
  setIsUsePreview: React.Dispatch<React.SetStateAction<boolean>>
  hideMenu: () => void
  tableChange: TableProps<FileInfoCustom>['onChange']
}

const FileManageContext = React.createContext<FileManageContextType | undefined>(undefined)

export default FileManageContext
