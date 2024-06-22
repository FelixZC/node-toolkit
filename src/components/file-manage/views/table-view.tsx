import FileManageContext from '../context'
import React, { useContext, useRef, useState, useEffect } from 'react'
import { Table } from 'antd'
import type { TableColumnsType } from 'antd'
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
    const tableRef = useRef<HTMLDivElement | null>(null)
    const [scroll, setScroll] = useState({ y: 648 })
    useEffect(() => {
      const handleResize = () => {
        if (tableRef.current) {
          const parentHeight = tableRef.current.parentElement!.offsetHeight
          setScroll({ y: parentHeight - 40 })
        }
      }
      window.addEventListener('resize', handleResize)
      handleResize() // 初始化时调用一次
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }, [])

    return (
      <Table
        ref={tableRef as any}
        className={className}
        dataSource={files}
        pagination={false}
        size="small"
        virtual={true}
        scroll={scroll}
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
