import React, { useContext } from 'react'
import { FileInfoCustom } from '@src/types/file'
import FileManageContext from '../context'
interface ViewProps<T> {
  files: T[]
  className?: string
}
const MediumIconView: React.FC<ViewProps<FileInfoCustom>> = ({ files, className }) => {
  const context = useContext(FileManageContext)
  if (!context) {
    throw new Error('useContext must be inside a FileManageContext.Provider')
  }
  const { onRowClick, onDoubleClick, onContextMenu } = context
  return (
    <div className={'icon-view__medium ' + className}>
      {files.map((file) => (
        <div
          key={file.key}
          className="file-item"
          onClick={(event) => onRowClick(event, file)}
          onDoubleClick={(event) => onDoubleClick(event, file)}
          onContextMenu={(event) => onContextMenu(event, file)}
        >
          <img src={file.fileIcon} alt="File icon" className="file-icon" />
          <span className="file-name">{file.base}</span>
        </div>
      ))}
    </div>
  )
}
export default React.memo(MediumIconView)