import React, { useContext, useState, useEffect, useRef, useCallback } from 'react'
import { FileInfoCustom } from '@src/types/file'
import FileManageContext from '../context'
import debounce from 'lodash/debounce'
interface ViewProps<T> {
  files: T[]
  className?: string
}

interface FileInfoWithIcon extends FileInfoCustom {
  scrollTop?: number
  itemHeight?: number
  startRow?: number
}

const LargeIconView: React.FC<ViewProps<FileInfoCustom>> = (props) => {
  const context = useContext(FileManageContext)
  if (!context) return null

  const { onRowClick, onDoubleClick, onContextMenu } = context
  const [visibleItems, setVisibleItems] = useState<FileInfoWithIcon[]>([])
  const [containHeight, setContainHeight] = useState(0)
  const viewRef = useRef<HTMLDivElement | null>(null)

  const getIsNeedVisible = () => {
    return props.files.length > 100
  }

  const getItemInfo = () => {
    // 获取元素的计算后的样式
    const computedStyle = window.getComputedStyle(viewRef.current!)
    const gridGapValue = computedStyle.getPropertyValue('grid-gap')
    const gridColumnsValue = computedStyle.getPropertyValue('grid-template-columns')
    const gridRowsValue = computedStyle.getPropertyValue('grid-template-rows')
    // 将这些值分割并提取你需要的数字
    const gapValue = parseInt(gridGapValue, 10) // 假设grid-gap总是以px为单位
    const gridColumnsValues = gridColumnsValue.match(/\d+/g)!.map(Number)[0]
    const gridRowsValues = gridRowsValue.match(/\d+/g)!.map(Number)[0]
    const gap = gapValue
    //取渲染后的一个项作动态变化
    const fileItemElement = document.querySelector('.file-item')
    if (fileItemElement) {
      fileItemElement.getBoundingClientRect()
      const fileItemWidth = fileItemElement.clientWidth
      const fileItemHeight = fileItemElement.clientHeight
      return {
        width: fileItemWidth,
        height: fileItemHeight,
        gap
      }
    } else {
      return {
        width: gridColumnsValues,
        height: gridRowsValues,
        gap
      }
    }
  }

  const calculateVisibleItems = useCallback(() => {
    if (getIsNeedVisible()) {
      const view = viewRef.current
      if (!view) return
      const itemInfo = getItemInfo()
      const columns = Math.floor((view.clientWidth - itemInfo.gap) / itemInfo.width)
      const clientRows = Math.floor(view.clientHeight / itemInfo.height)
      const rowsTotal = Math.ceil(props.files.length / columns)
      const virtualHeight = rowsTotal * itemInfo.height
      setContainHeight(virtualHeight)
      const scrollTop = view.scrollTop
      const startRow = Math.round(scrollTop / itemInfo.height)
      const startIdx = startRow * columns
      //补充视野
      let endIdx = startIdx + columns * clientRows
      // endIdx += (endIdx - startIdx + 1) % columns
      const newVisibleItems = props.files.slice(
        Math.max(startIdx, 0),
        Math.min(endIdx, props.files.length)
      )
      const result = newVisibleItems.map((file) => ({
        ...file,
        scrollTop,
        startRow,
        itemHeight: itemInfo.height
      }))
      setVisibleItems(result)
    }
  }, [viewRef.current, props.files])

  useEffect(() => {
    if (getIsNeedVisible()) {
      calculateVisibleItems()
    } else {
      setVisibleItems(props.files)
      setContainHeight(0)
    }
  }, [props.files])

  useEffect(() => {
    if (getIsNeedVisible()) {
      const handleResize = debounce(() => {
        calculateVisibleItems()
      }, 100)
      window.addEventListener('resize', handleResize)
      const resizeObserver = new ResizeObserver((entries) => {
        handleResize()
      })
      viewRef.current && resizeObserver.observe(viewRef.current)
      return () => {
        window.removeEventListener('resize', handleResize)
        viewRef.current && resizeObserver.unobserve(viewRef.current)
        resizeObserver.disconnect()
      }
    }
  }, [viewRef.current, props.files])

  const onScroll = debounce(calculateVisibleItems, 10)

  return (
    <div ref={viewRef} className={props.className} onScroll={onScroll}>
      {visibleItems.map((file) => (
        <div
          key={file.key}
          className="file-item"
          // style={getIsNeedVisible() ? { transform: `translateY(${file.scrollTop}px)` } : {}}
          style={
            getIsNeedVisible()
              ? { transform: `translateY(${file.startRow! * file.itemHeight!}px)` }
              : {}
          }
          onClick={(event) => onRowClick(event, file)}
          onDoubleClick={(event) => onDoubleClick(event, file)}
          onContextMenu={(event) => onContextMenu(event, file)}
        >
          <img src={file.fileIcon} alt="File icon" className="file-icon" />
          <span className="file-name">{file.base}</span>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          height: containHeight,
          width: 1,
          backgroundColor: 'transparent'
        }}
      />
    </div>
  )
}
export default React.memo(LargeIconView, (prevProps, nextProps) => {
  return prevProps.files === nextProps.files
})
