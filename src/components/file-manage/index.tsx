//index.tsx
import React, { useEffect, useState, useRef } from 'react'
import { Layout, Input, Select, message } from 'antd'
import useDirectory from '@src/store/use-directory'
import { ipcRendererInvoke } from '@src/utils/desktop-utils'
import { compare, copyTextToClipboard } from '@src/utils/common'
import debounce from 'lodash/debounce'
import ContextMenu from './menus'
import Preview from './preview'
import TableView from './views/table'
import LargeIconView from './views/large-icon'
import MediumIconView from './views/medium-icon'
import SmallIconView from './views/small-icon'
import '@src/style/less/file-manage.less'
import type { FileInfoCustom, FileInfoWithStats } from '@src/types/file'
import type { TableProps, TableColumnsType, MenuProps } from 'antd'
const { Header, Content, Footer } = Layout
const { Option } = Select
const FileManage: React.FC = () => {
  console.log('Reander FileManage')

  const { directoryPath } = useDirectory()

  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<FileInfoCustom[]>([])
  const [filterResult, setFilterResult] = useState<FileInfoCustom[]>([])
  const [originalData, setOriginalData] = useState<FileInfoCustom[]>([])
  const [isSorted, setIsSorted] = useState<boolean>(false)
  const [currentView, setCurrentView] = useState<string>('detail') // 默认为大图标视图
  const [isUsePreview, setIsUsePreview] = useState<boolean>(false)
  const [previewFile, setPreviewFile] = useState<FileInfoCustom | null>(null)
  const [currentRow, setCurrentRow] = useState<FileInfoCustom | null>(null)
  // const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  // const [sortFields, setSortFields] = useState<string[]>(['name']);
  const contextContainerRef = useRef<HTMLDivElement>(null)
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const getMenus = () => {
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
            setIsMenuVisible(false)
          }
        }
      ]
    }
    return menus
  }

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>, record?: FileInfoCustom) => {
    e.preventDefault()
    e.stopPropagation()
    // 确保menuRef.current是有效的DOM元素
    // 根据鼠标位置和页面滚动计算菜单位置
    if (contextContainerRef.current) {
      const rect = contextContainerRef.current.getBoundingClientRect()
      const x = e.clientX - window.scrollX - rect.left // 减去页面的水平滚动距离
      const y = e.clientY - window.scrollY - rect.top // 减去页面的垂直滚动距离
      setMenuPosition({ x, y })
      setIsMenuVisible(true)
    }
    if (record) {
      setCurrentRow(record)
    }
  }

  // 当用户点击Table中的某一行时，更新预览文件状态
  const OnRowClick = React.useCallback(
    (event: React.MouseEvent<any, MouseEvent>, record: FileInfoCustom) => {
      if (previewFile?.filePath === record.filePath) {
        return
      }
      //先放着了，还用不到
      if (previewFile) {
        previewFile.isSelected = false
      }
      record.isSelected = true
      if (record.type === 'Folder') {
        setPreviewFile(null)
      } else {
        setPreviewFile(record)
      }
      setCurrentRow(record)
    },
    []
  )

  const onDoubleClick = React.useCallback(
    (event: React.MouseEvent<any, MouseEvent>, record: FileInfoCustom) => {
      setCurrentRow(record)
      ipcRendererInvoke('open-file', record.filePath)
    },
    []
  )
  /**
   * 表格数据变更处理函数。
   *
   * 该函数用于处理表格的分页、筛选和排序变化。根据这些变化，对数据进行相应的处理并更新表格展示的数据。
   *
   * @param pagination 分页信息，包含当前页码和每页的记录数等。
   * @param filters 筛选条件，用于过滤数据。
   * @param sorter 排序条件，用于对数据进行排序。
   */
  const tableChange: TableProps<FileInfoCustom>['onChange'] = (pagination, filters, sorter) => {
    // 创建一个副本，用于后续的排序操作，以避免直接修改原始数据。
    let sortedData = [...filterResult]
    // 处理sorter的格式，确保其为数组形式。
    let localSorter = Array.isArray(sorter) ? sorter : [sorter]
    // 检查是否有排序需求，如果排序过则重置数据并取消排序状态，没有则直接返回。
    const isNeedOrder = localSorter.some((item) => item.order)
    if (!isNeedOrder) {
      if (isSorted) {
        setFilterResult(originalData)
        setIsSorted(false)
      }
      return
    }
    // 如果当前没有排序状态，记录排序后的数据作为原始数据。
    if (!isSorted) {
      setOriginalData([...filterResult])
    }
    // 遍历排序条件，对数据进行排序。
    // 对数组中的每个排序条件进行排序
    // 处理剩余的排序条件
    localSorter.forEach((curSorter, index) => {
      // 当排序条件有效时，进行排序操作。
      // 使用稳定排序算法
      if (curSorter.order && typeof curSorter.field === 'string') {
        sortedData = sortedData.sort((a, b) =>
          compare(a, b, curSorter.order!, [curSorter.field as string])
        )
      } else {
        // 当排序条件无效时，打印错误信息。
        // 处理无效的 curSorter.order 或 curSorter.field
        console.error('Invalid sorter configuration:', curSorter)
      }
    })
    // 更新排序状态。
    setIsSorted(true)
    // 更新过滤后的数据，以反映排序的变化。
    // 这里可以处理排序后的数据，例如更新状态或进行其他操作
    setFilterResult(sortedData)
  }
  const columns: TableColumnsType<FileInfoCustom> = [
    {
      title: '名称',
      dataIndex: 'base',
      key: 'base',
      render: (text, record) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={record.fileIcon}
              alt="icon"
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
            <span>{text}</span>
          </div>
        )
      },
      sorter: true
    },
    {
      title: '文件路径',
      dataIndex: 'filePath',
      key: 'filePath',
      sorter: true
    },
    {
      title: '文件大小',
      dataIndex: 'sizeFormat',
      key: 'sizeFormat',
      width: 100,
      sorter: true
    },
    {
      title: '修改时间',
      dataIndex: 'mtimeFormat',
      key: 'mtimeFormat',
      sorter: true
    }
  ]
  const currentViewComponent = () => {
    switch (currentView) {
      case 'small-icon':
        return (
          <SmallIconView
            className="file-manage-content__left"
            files={filterResult}
            onRowClick={OnRowClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
          />
        )
      case 'medium-icon':
        return (
          <MediumIconView
            className="file-manage-content__left"
            files={filterResult}
            onRowClick={OnRowClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
          />
        )
      case 'large-icon':
        return (
          <LargeIconView
            className="file-manage-content__left"
            files={filterResult}
            onRowClick={OnRowClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
          />
        )
      case 'detail':
      default:
        return (
          <TableView
            className="file-manage-content__left"
            files={filterResult}
            columns={columns}
            onRowClick={OnRowClick}
            tableChange={tableChange}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
          />
        )
    }
  }

  // 使用节流函数的地方，例如在 input 元素的 onChange 事件中
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }

  const handleFilterChange = debounce(() => {
    if (searchValue.length) {
      const filtered = searchResults.filter((item) => item.name.includes(searchValue))
      setFilterResult(filtered)
    } else {
      setFilterResult(searchResults)
    }
    console.log('searchResults', searchResults)
  }, 300)

  const execSearch = async () => {
    if (!directoryPath) {
      return
    }
    try {
      const result: FileInfoWithStats[] = await ipcRendererInvoke(
        'get-dir-and-file-info',
        directoryPath
      )
      const customResult: FileInfoCustom[] = result.map((item) => {
        return {
          ...item,
          key: item.filePath,
          isSelected: false
        }
      })
      setSearchResults(customResult)
    } catch (error) {
      console.error('Error loading directory info:', error)
      // 可以在这里添加错误提示逻辑
    }
  }

  useEffect(() => {
    console.log('directoryPath change', directoryPath)
    execSearch()
  }, [directoryPath])

  useEffect(() => {
    handleFilterChange()
  }, [searchValue, searchResults])

  const handleFilterTypeChange = (value: string) => {
    let filteredResults: FileInfoCustom[]
    if (value == 'All') {
      filteredResults = searchResults
    } else {
      filteredResults = searchResults.filter((item) => item.type === value)
    }
    setFilterResult(filteredResults)
  }

  return (
    <Layout className="file-manage-layout">
      <div className="file-manage-path">
        <span className="file-manage-path_result">当前路径：{directoryPath}</span>
      </div>
      <Header className="file-manage-header">
        <Input
          className="file-manage-header__search"
          size="small"
          placeholder="输入搜索内容"
          value={searchValue}
          onChange={(e) => onInputChange(e)}
        />
        <Select
          size="small"
          className="file-manage-header__select"
          style={{ width: 120, marginLeft: 8 }}
          defaultValue="All"
          onChange={handleFilterTypeChange}
        >
          <Option value="All">所有文件</Option>
          <Option value="Folder">文件夹</Option>
          <Option value="Document">文档</Option>
          <Option value="Image">图片</Option>
          <Option value="Video">视频</Option>
          <Option value="Audio">音频</Option>
          <Option value="Executable">可执行文件</Option>
          <Option value="Font">字体</Option>
          <Option value="Plain Text">文本文件</Option>
          <Option value="Archive">压缩文件</Option>
          <Option value="Application">应用文件</Option>
          <Option value="Other">其他</Option>
        </Select>
      </Header>
      <Content
        ref={contextContainerRef}
        onContextMenu={onContextMenu}
        className="file-manage-content"
      >
        <ContextMenu
          menu={getMenus()}
          isMenuVisible={isMenuVisible}
          menuPosition={menuPosition}
          setIsMenuVisible={setIsMenuVisible}
        />
        {currentViewComponent()}
        {isUsePreview && (
          <Preview previewFile={previewFile} className="file-manage-content__right" />
        )}
      </Content>
      <Footer className="file-manage-footer">
        {/* 显示文件搜索结果 */}
        <span className="file-manage-footer__result">搜索结果：{filterResult.length}</span>
      </Footer>
    </Layout>
  )
}

export default FileManage
