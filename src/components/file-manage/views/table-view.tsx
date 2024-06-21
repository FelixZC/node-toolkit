import React, { useContext } from 'react'
import { Table } from 'antd'
import { TableColumnsType } from 'antd'
import FileManageContext from '../context'
import type { FileInfoCustom } from '@src/types/file'

interface ViewProps {
  files: FileInfoCustom[]
  columns: TableColumnsType<FileInfoCustom>
  className?: string
}

const TableView: React.FC<ViewProps> = React.memo(
  ({ files, columns, className }) => {
    const context = useContext(FileManageContext)
    if (!context) {
      throw new Error('useContext must be inside a FileManageContext.Provider')
    }
    const { onRowClick, onDoubleClick, onContextMenu, tableChange } = context
    return (
      <Table
        className={className}
        dataSource={files}
        pagination={false}
        virtual={true}
        size="small"
        showHeader={true}
        columns={columns}
        rowKey={(record) => record.key}
        onRow={(record) => {
          return {
            onClick: (event) => {
              onRowClick(event, record)
            },
            onDoubleClick: (event) => {
              onDoubleClick(event, record)
            },
            onContextMenu: (event) => {
              onContextMenu(event, record)
            },
            style: {
              cursor: 'pointer'
            }
          }
        }}
        onChange={tableChange}
      />
    )
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  }
)
export default React.memo(TableView, (prevProps, nextProps) => {
  return prevProps.files === nextProps.files
})
