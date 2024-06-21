import React, { memo, useState } from 'react'
import { Tooltip } from 'antd'
type SvgIconProps = {
  // 图标名称
  svgName: string
  // 图标尺寸，不传时为图标默认24px
  iconSize?: number
  /**
   * 若该图标需要hover时改变颜色，请先把该图标内置fill属性删除，然后传入两个值，
   * iconColor：原始颜色，hoverColor：hover时的颜色
   */
  hasHover?: boolean
  // 图标默认颜色
  iconColor?: string
  // 图标hover时的颜色
  hoverColor?: string
  // 图标外层盒子的类名
  className?: string
  // 是否需要显示小手
  needPointer?: boolean
  // 图标提示文案
  toolTipValue?: string
}
/**
 * SvgIcon是一个用于渲染SVG图标的函数组件。
 * @param props - 组件接收的属性。
 * @param props.svgName - SVG图标的名称，用于通过use元素引用图标。
 * @param props.iconSize - 图标的大小，以像素为单位。
 * @param props.hasHover - 图标是否具有悬停效果。
 * @param props.iconColor - 图标的基本颜色。
 * @param props.hoverColor - 图标在悬停时的颜色。
 * @param props.className - 为图标容器添加的CSS类名。
 * @param props.needPointer - 图标是否需要指针样式（用于点击等交互）。
 * @param props.toolTipValue - 图标的工具提示文本。
 * @returns 返回一个封装在Tooltip组件中的SVG图标，可选地具有悬停效果、工具提示和自定义样式。
 */

const SvgIcon = ({
  svgName,
  iconSize = 24,
  hasHover = false,
  iconColor = '#000000',
  hoverColor = '#000000',
  className = '',
  needPointer = false,
  toolTipValue = ''
}: SvgIconProps) => {
  // 使用useState管理SVG颜色状态
  const [svgColor, setSvgColor] = useState(iconColor)

  // 处理鼠标进入事件，改变SVG颜色（如果有悬停效果）
  const handleMouseEnter = () => {
    if (hasHover) {
      setSvgColor(hoverColor)
    }
  }

  // 处理鼠标离开事件，恢复SVG颜色（如果有悬停效果）
  const handleMouseLeave = () => {
    if (hasHover) {
      setSvgColor(iconColor)
    }
  }

  // 渲染SVG图标，包括其容器和交互逻辑
  return (
    <Tooltip title={toolTipValue} arrow={false}>
      <div
        id="svg-icon"
        style={{
          width: iconSize,
          height: iconSize,
          cursor: needPointer ? 'pointer' : 'normal'
        }}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          fill={svgColor}
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <use xlinkHref={`#svg-${svgName}`} />
        </svg>
      </div>
    </Tooltip>
  )
}

export default memo(SvgIcon)
