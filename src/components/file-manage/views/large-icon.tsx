import React, { useContext, useState, useEffect, useRef } from 'react'
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
  ({ files, className }) => {
    const context = useContext(FileManageContext)
    if (!context) {
      // 优雅处理context为null的情况
      return null
    }
    const { onRowClick, onDoubleClick, onContextMenu } = context

    const [visibleItems, setVisibleItems] = useState<FileInfoWithIcon[]>([])
    const viewRef = useRef<HTMLDivElement | null>(null)
    const itemRef = useRef<HTMLDivElement | null>(null)
    const hidenRef = useRef<HTMLDivElement | null>(null)

    const calculateVisibleItems = () => {
      if (files.length > 1000 && viewRef.current) {
        let gridInfo = {
          columns: Math.floor(viewRef.current.parentElement!.offsetWidth / 150),
          rows: Math.floor(viewRef.current.clientHeight / 150),
          itemWidth: 150,
          itemHeight: 150
        }
        if (itemRef.current) {
          gridInfo.itemHeight = itemRef.current.offsetHeight
          gridInfo.itemWidth = itemRef.current.offsetWidth
          gridInfo.columns = Math.floor(
            viewRef.current.parentElement!.clientWidth / gridInfo.itemWidth
          )
          gridInfo.rows = Math.floor(
            viewRef.current.parentElement!.clientHeight / gridInfo.itemHeight
          )
        }
        if (hidenRef.current) {
          const rows = Math.ceil(files.length / gridInfo.columns)
          hidenRef.current.style.height = Math.max(rows, gridInfo.rows) * gridInfo.itemHeight + 'px'
        }
        const scrollTop = viewRef.current.scrollTop
        const startRow = Math.ceil(scrollTop / gridInfo.itemHeight)
        const startIdx = startRow * gridInfo.columns
        const endIdx = startIdx + gridInfo.columns * gridInfo.rows
        const newVisibleItems = files.slice(Math.max(startIdx, 0), Math.min(endIdx, files.length))
        const result = newVisibleItems.map((file, i) => ({ ...file, scrollTop }))
        setVisibleItems(result)
      } else {
        if (visibleItems.length === files.length) {
          return
        }
        const newVisibleItems = files.map((file, i) => ({ ...file, scrollTop: 0 }))
        setVisibleItems(newVisibleItems)
      }
    }

    useEffect(() => {
      calculateVisibleItems()
    }, [files])

    useEffect(() => {
      const handleResize = () => {
        calculateVisibleItems()
      }
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }, [])

    return (
      <div
        ref={viewRef}
        className={`icon-view__lager ${className || ''}`}
        onScroll={calculateVisibleItems}
      >
        <div
          ref={hidenRef}
          style={{ position: 'absolute', height: 0, width: 1, backgroundColor: 'transparent' }}
        />
        {visibleItems.map((file, i) => (
          <div
            ref={itemRef}
            key={file.key}
            className="file-item"
            style={{
              transform: `translateY(${file.scrollTop}px)`
            }}
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
    return prevProps.files === nextProps.files
  }
)

export default LargeIconView
