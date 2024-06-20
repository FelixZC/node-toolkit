import React from 'react'
import { Table } from 'antd'
import { TableColumnsType } from 'antd'
import type { TableProps } from 'antd'

// 定义泛型接口 ViewProps，需要在组件使用时指定具体的类型参数
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
        rowKey={(record) => record.key || record.id} // 确保每条记录都有一个唯一的 key 或 id 属性
        onRow={(record) => {
          return {
            onClick: (event) => {
              onRowClick(event, record)
            }, // 点击行时调用 onRowClick 函数
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
    // React.memo 的比较函数，用于决定是否需要重新渲染组件
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  }
)

export default React.memo(TableView, (prevProps, nextProps) => {
  return prevProps.files === nextProps.files
})
