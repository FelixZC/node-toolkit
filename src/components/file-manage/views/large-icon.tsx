import React, { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { FileInfoCustom } from '@src/types/file'
import FileManageContext from '../context'

interface ViewProps<T> {
  files: T[]
  className?: string
}

interface FileInfoWithIcon extends FileInfoCustom {
  scrollTop: number
}

const LargeIconView: React.FC<ViewProps<FileInfoCustom>> = React.memo(
  (props) => {
    const context = useContext(FileManageContext)
    if (!context) return null

    const { onRowClick, onDoubleClick, onContextMenu } = context
    const [visibleItems, setVisibleItems] = useState<FileInfoWithIcon[]>([])
    const [containHeight, setContainHeight] = useState(0)
    const viewRef = useRef<HTMLDivElement | null>(null)

    const calculateVisibleItems = useCallback(() => {
      const view = viewRef.current
      if (!view) return

      const getGridInfo = () => {
        const columns = Math.floor(view.parentElement!.offsetWidth / 160)
        const rows = Math.floor(view.clientHeight / 160)
        return { columns, rows, itemWidth: 160, itemHeight: 160 }
      }
      const gridInfo = getGridInfo()
      const scrollTop = view.scrollTop
      const startRow = Math.ceil(scrollTop / gridInfo.itemHeight)
      const startIdx = startRow * gridInfo.columns
      const endIdx = startIdx + gridInfo.columns * gridInfo.rows
      const newVisibleItems = props.files.slice(
        Math.max(startIdx, 0),
        Math.min(endIdx, props.files.length)
      )

      const result = newVisibleItems.map((file) => ({
        ...file,
        scrollTop
      }))
      setVisibleItems(result)

      const visibleHeight =
        Math.max(Math.ceil(props.files.length / gridInfo.columns), gridInfo.rows) *
        gridInfo.itemHeight
      setContainHeight(visibleHeight)
    }, [props.files.length, viewRef])

    useEffect(() => {
      calculateVisibleItems()
    }, [calculateVisibleItems, props.files])

    useEffect(() => {
      const handleResize = () => calculateVisibleItems()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [calculateVisibleItems])

    return (
      <div
        ref={viewRef}
        className={`icon-view__lager ${props.className || ''}`}
        onScroll={calculateVisibleItems}
      >
        <div
          style={{
            position: 'absolute',
            height: containHeight,
            width: 1,
            backgroundColor: 'transparent'
          }}
        />
        {visibleItems.map((file) => (
          <div
            className="file-item"
            style={{ transform: `translateY(${file.scrollTop}px)` }}
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
  },
  (prevProps, nextProps) => {
    return prevProps.files === nextProps.files && prevProps.className === nextProps.className
  }
)

export default LargeIconView
