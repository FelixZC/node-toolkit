import React from 'react'
import { Table } from 'antd'
import { TableColumnsType } from 'antd'
import type { TableProps } from 'antd'

interface ViewProps<R> {
  files: R[]
  columns: TableColumnsType<R>
  className?: string
  onRowClick: (event: React.MouseEvent<any, MouseEvent>, record: R) => void
  onDoubleClick: (event: React.MouseEvent<any, MouseEvent>, record: R) => void
  onContextMenu: (event: React.MouseEvent<any, MouseEvent>, record: R) => void
  tableChange: TableProps<R>['onChange']
}
const TableView: React.FC<ViewProps<any>> = React.memo(
  ({ files, columns, className, onRowClick, onDoubleClick, onContextMenu, tableChange }) => {
    return (
      <Table
        className={className}
        dataSource={files}
        pagination={false}
        virtual={true}
        size="small"
        showHeader={true}
        columns={columns}
        rowKey={(record) => record.key || record.id}
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
