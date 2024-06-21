// useContextMenu.js
import { useState } from 'react'
const useContextMenu = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const [menuPosition, setMenuPosition] = useState({
    x: 0,
    y: 0
  })
  const showMenu = (position: { x: number; y: number }) => {
    setMenuPosition(position)
    setIsMenuVisible(true)
  }
  const hideMenu = () => {
    setIsMenuVisible(false)
  }
  return {
    isMenuVisible,
    menuPosition,
    showMenu,
    hideMenu
  }
}
export default useContextMenu
