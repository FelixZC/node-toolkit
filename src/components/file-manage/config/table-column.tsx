import React from 'react'
import type { FileInfoCustom } from '@src/types/file'
import type { TableColumnsType } from 'antd'
import { formatFileSize } from '@src/utils/common'
const columns: TableColumnsType<FileInfoCustom> = [
  {
    title: '名称',
    dataIndex: 'base',
    key: 'base',
    render: (text, record) => {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <img
            src={record.fileIcon}
            alt="icon"
            style={{
              width: 24,
              height: 24,
              marginRight: 8
            }}
          />
          <span>{text}</span>
        </div>
      )
    },
    sorter: true
  },
  {
    title: '文件路径',
    dataIndex: 'filePath',
    key: 'filePath',
    sorter: true
  },
  {
    title: '文件大小',
    dataIndex: 'size',
    key: 'size',
    width: 100,
    sorter: true,
    render: (text, record) => {
      const result = record.type === 'Folder' ? '' : formatFileSize(record.size)
      return (
        <div>
          <span>{result}</span>
        </div>
      )
    }
  },
  {
    title: '修改时间',
    dataIndex: 'mtimeFormat',
    key: 'mtimeFormat',
    width: 150,
    sorter: true
  }
]
export default columns
