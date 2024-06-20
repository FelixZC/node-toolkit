import React, { useEffect, useState, memo } from 'react'
import type { FileInfoCustom } from '@src/types/file'
import { ipcRendererInvoke } from '@src/utils/desktop-utils'
import { Resizable, ResizeCallback } from 're-resizable'

interface Props {
  previewFile: FileInfoCustom | null
  className?: string
}

const Priview: React.FC<Props> = ({ previewFile, className }) => {
  const [fileContent, setFileContent] = useState('')
  const [width, setWidth] = useState<number>(200) // 用于存储宽度状态

  const getFileContent = async () => {
    if (previewFile && !(previewFile.type === 'Folder')) {
      const content = await ipcRendererInvoke('read-file', previewFile.filePath)
      setFileContent(content || '')
    }
  }

  useEffect(() => {
    getFileContent()
  }, [previewFile])

  const onResize: ResizeCallback = (event, direction, elementRef, delta) => {
    setWidth(width + delta.width)
  }

  return (
    <Resizable
      className={className}
      size={{ width: width }} // 使用状态来控制宽度
      enable={{ left: true }}
      onResizeStop={onResize}
    >
      <div>
        {previewFile ? (
          <pre style={{ margin: 0 }}>{fileContent}</pre>
        ) : (
          <span style={{ margin: 0 }}>No Content</span>
        )}
      </div>
    </Resizable>
  )
}

export default memo(Priview)
