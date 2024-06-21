import { copyTextToClipboard } from '@src/utils/common'
import FileManageContext from '../context'
import { MenuProps } from 'antd'
import { message } from 'antd'
//menus.tsx
import { useContext } from 'react'
const getMenus = () => {
  const context = useContext(FileManageContext)
  if (!context) {
    throw new Error('useContext must be inside a FileManageContext.Provider')
  }
  const { currentRow, setCurrentView, isUsePreview, hideMenu, setIsUsePreview } = context
  const menus: MenuProps = {
    mode: 'vertical',
    items: [
      {
        key: 'view',
        type: 'submenu',
        label: '视图切换',
        children: [
          {
            key: 'large-icon',
            label: '大图标',
            type: 'item',
            onClick: () => {
              setCurrentView('large-icon')
            }
          },
          {
            key: 'medium-icon',
            label: '中等图标',
            type: 'item',
            onClick: () => {
              setCurrentView('medium-icon')
            }
          },
          {
            key: 'small-icon',
            label: '小图标',
            type: 'item',
            onClick: () => {
              setCurrentView('small-icon')
            }
          },
          {
            key: 'detail',
            label: '详情',
            type: 'item',
            onClick: () => {
              setCurrentView('detail')
            }
          },
          {
            key: 'preview',
            type: 'item',
            label: isUsePreview ? '关闭预览' : '开启预览',
            onClick: () => {
              setIsUsePreview(!isUsePreview)
            }
          }
        ]
      },
      // {
      //   key: 'sort',
      //   type: 'submenu',
      //   label: '排序',
      //   children: [
      //     {
      //       key: 'filePath',
      //       label: '名称',
      //       type: 'item',
      //       onClick: () => { }
      //     }
      //   ]
      // },
      {
        key: 'copy',
        type: 'item',
        label: '复制路径',
        onClick: async () => {
          if (currentRow) {
            await copyTextToClipboard(currentRow.filePath)
          } else {
            message.error('请选择文件')
          }
          hideMenu()
        }
      }
    ]
  }
  return menus
}
export default getMenus
