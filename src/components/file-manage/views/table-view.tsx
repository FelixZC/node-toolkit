import FileManageContext from '../context'
import React, { useContext, useRef, useState, useEffect, useCallback } from 'react'
import { Table } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FileInfoCustom } from '@src/types/file'

interface ViewProps {
  files: FileInfoCustom[]
  columns: TableColumnsType<FileInfoCustom>
  className?: string
}

const TableView: React.FC<ViewProps> = ({ files, columns, className }) => {
  const context = useContext(FileManageContext)
  if (!context) {
    throw new Error('useContext must be inside a FileManageContext.Provider')
  }
  const { onRowClick, onDoubleClick, onContextMenu, tableChange } = context
  const tableRef = useRef<HTMLElement>(null)
  const [scroll, setScroll] = useState({ y: 648 })

  const handleResize = useCallback(() => {
    if (tableRef.current?.parentElement) {
      const parentHeight = tableRef.current.parentElement.offsetHeight
      setScroll({ y: parentHeight - 40 })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    handleResize() // 初始化时调用一次
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  const onRow = useCallback(
    (record: FileInfoCustom) => {
      return {
        onClick: (event: React.MouseEvent<HTMLDivElement>) => onRowClick(event, record),
        onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => onDoubleClick(event, record),
        onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => onContextMenu(event, record),
        style: {
          cursor: 'pointer'
        }
      }
    },
    [onRowClick, onDoubleClick, onContextMenu]
  )

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
      onRow={onRow}
      onChange={tableChange}
    />
  )
}

export default React.memo(TableView, (prevProps, nextProps) => {
  return prevProps.files === nextProps.files
})
