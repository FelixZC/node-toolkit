import React, { useEffect } from 'react'
import { Menu, MenuProps } from 'antd'
interface ContextMenuProps {
  menu: MenuProps
  menuPosition: { x: number; y: number }
  isMenuVisible: boolean
  setIsMenuVisible: (visible: boolean) => void
}
const ContextMenu: React.FC<ContextMenuProps> = ({
  menu,
  menuPosition,
  isMenuVisible,
  setIsMenuVisible
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 定义一个函数来处理点击事件
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击的元素是否不在上下文菜单的DOM元素中
      if (isMenuVisible && !menuRef.current?.contains(event.target as Node)) {
        setTimeout(() => {
          setIsMenuVisible(false)
        }, 100)
      }
    }

    // 添加点击事件监听器
    document.addEventListener('mousedown', handleClickOutside)

    // 组件卸载时移除事件监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuVisible]) // 只有当 isMenuVisible 或 closeMenu 变化时，才重新运行这个副作用
  // 渲染菜单项的函数
  // 使用类型守卫来检查 items 是否存在并且是一个数组

  const renderMenuItem = (items: MenuProps['items']) => {
    if (!Array.isArray(items)) {
      return null
    }
    return items.map((item) => {
      if (item?.type === 'divider') {
        return <Menu.Divider key={item.key || 'divider'} />
      } else if (item?.type === 'submenu') {
        return (
          <Menu.SubMenu key={item.key} title={item.label} onTitleClick={item.onTitleClick}>
            {renderMenuItem(item.children)}
          </Menu.SubMenu>
        )
      } else if (item?.type === 'item') {
        return (
          <Menu.Item key={item.key} onClick={item.onClick}>
            {item.label}
          </Menu.Item>
        )
      } else if (item?.type === 'group') {
        return (
          <Menu.ItemGroup key={item.key} title={item.label}>
            {renderMenuItem(item.children)}
          </Menu.ItemGroup>
        )
      } else {
        return <div>Give a type in this menuItem</div>
      }
    })
  }
  // 渲染先后问题，不适合写在这里
  // const adjustMenuPosition = (position: { x: number; y: number }) => {
  //   const menuElement = menuRef.current;
  //   if (!menuElement) return { left: position.x, top: position.y }
  //   const menuWidth = menuElement.offsetWidth;
  //   const menuHeight = menuElement.offsetHeight;
  //   const parentElement = menuElement.offsetParent;
  //   const parentWidth = parentElement ? parentElement.clientWidth : 0;
  //   const parentHeight = parentElement ? parentElement.clientHeight : 0;
  //   let adjustedX = position.x;
  //   if (adjustedX + menuWidth > parentWidth) {
  //     adjustedX = parentWidth - menuWidth; // 调整到视窗右边界内
  //   }
  //   let adjustedY = position.y;
  //   if (adjustedY + menuHeight > parentHeight) {
  //     adjustedY = parentHeight - menuHeight; // 调整到视窗下边界内
  //   }
  //   return { left: adjustedX, top: adjustedY };
  // };
  return (
    <div ref={menuRef}>
      {isMenuVisible && (
        <div
          className="context-menu"
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }} // 阻止默认的上下文菜单显示
          style={{
            // ...adjustMenuPosition(menuPosition), // 使用调整后的位置
            left: menuPosition.x,
            right: menuPosition.y
          }}
        >
          <Menu mode={menu.mode}>{renderMenuItem(menu.items)}</Menu>
        </div>
      )}
    </div>
  )
}

export default React.memo(ContextMenu)
