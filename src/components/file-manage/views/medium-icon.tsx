import React from 'react'
import { FileInfoCustom } from '@src/types/file'
interface ViewProps<T> {
  files: T[]
  className?: string
  onRowClick: (event: React.MouseEvent<any, MouseEvent>, record: T) => void
  onDoubleClick: (event: React.MouseEvent<any, MouseEvent>, record: T) => void
  onContextMenu: (event: React.MouseEvent<any, MouseEvent>, record: T) => void
}

const MediumIconView: React.FC<ViewProps<FileInfoCustom>> = ({
  files,
  className,
  onRowClick,
  onDoubleClick,
  onContextMenu
}) => (
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

export default React.memo(MediumIconView)
