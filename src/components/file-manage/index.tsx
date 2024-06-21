import columns from './config/table-column'
import { compare } from '@src/utils/common'
import ContextMenu from '@src/components/antd-wrap/menus/index'
import debounce from 'lodash/debounce'
import FileManageContext from './context'
import getMenus from './config/menus'
import { Input, Layout, Select } from 'antd'
import { ipcRendererInvoke } from '@src/utils/desktop-utils'
import LargeIconView from './views/large-icon'
import MediumIconView from './views/medium-icon'
import options from './config/options'
import Preview from './views/preview'
import React, { useEffect, useRef, useState } from 'react'
import SmallIconView from './views/small-icon'
import TableView from './views/table-view'
import useContextMenu from '@src/components/antd-wrap/menus/use-context-menu'
import useDirectory from '@src/store/use-directory'
import '@src/style/less/file-manage.less'
import type { FileInfoCustom, FileInfoWithStats } from '@src/types/file'
import type { TableProps } from 'antd'
const { Header, Content, Footer } = Layout
const { Option } = Select
const FileManage: React.FC = () => {
  const { directoryPath } = useDirectory()
  const [searchValue, setSearchValue] = useState('')
  const [originalData, setOriginalData] = useState<FileInfoCustom[]>([])
  const [filterResult, setFilterResult] = useState<FileInfoCustom[]>([])
  const [isSorted, setIsSorted] = useState<boolean>(false)
  const [currentView, setCurrentView] = useState<string>('detail')
  const [isUsePreview, setIsUsePreview] = useState<boolean>(false)
  const [previewFile, setPreviewFile] = useState<FileInfoCustom | null>(null)
  const [currentRow, setCurrentRow] = useState<FileInfoCustom | null>(null)
  const contextContainerRef = useRef<HTMLDivElement>(null)
  const { isMenuVisible, menuPosition, showMenu, hideMenu } = useContextMenu()
  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>, record?: FileInfoCustom) => {
    e.preventDefault()
    e.stopPropagation()
    if (contextContainerRef.current) {
      const rect = contextContainerRef.current.getBoundingClientRect()
      const x = e.clientX - window.scrollX - rect.left
      const y = e.clientY - window.scrollY - rect.top
      showMenu({
        x,
        y
      })
    }
    if (record) {
      setCurrentRow(record)
    }
  }
  const onRowClick = (event: React.MouseEvent<HTMLDivElement>, record: FileInfoCustom) => {
    if (previewFile?.filePath === record.filePath) {
      return
    }
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
  }
  const onDoubleClick = (event: React.MouseEvent<HTMLDivElement>, record: FileInfoCustom) => {
    setCurrentRow(record)
    ipcRendererInvoke('open-file', record.filePath)
  }
  /**
   * 表格数据变更处理函数。
   * 该函数用于处理表格的分页、筛选和排序变化。根据这些变化，对数据进行相应的处理并更新表格展示的数据。
   * @param pagination 分页信息，包含当前页码和每页的记录数等。
   * @param filters 筛选条件，用于过滤数据。
   * @param sorter 排序条件，用于对数据进行排序。
   */
  const tableChange: TableProps<FileInfoCustom>['onChange'] = (pagination, filters, sorter) => {
    let sortedData = [...filterResult]
    let localSorter = Array.isArray(sorter) ? sorter : [sorter]
    const isNeedOrder = localSorter.some((item) => item.order)
    if (!isNeedOrder && isSorted) {
      setFilterResult(originalData)
      setIsSorted(false)
      return
    }
    localSorter.forEach((curSorter, index) => {
      if (curSorter.order && typeof curSorter.field === 'string') {
        sortedData = sortedData.sort((a, b) =>
          compare(a, b, curSorter.order!, [curSorter.field as string])
        )
      } else {
      }
    })
    setIsSorted(true)
    setFilterResult(sortedData)
  }
  const currentViewComponent = () => {
    switch (currentView) {
      case 'small-icon':
        return <SmallIconView className="file-manage-content__left" files={filterResult} />
      case 'medium-icon':
        return <MediumIconView className="file-manage-content__left" files={filterResult} />
      case 'large-icon':
        return <LargeIconView className="file-manage-content__left" files={filterResult} />
      case 'detail':
      default:
        return (
          <TableView className="file-manage-content__left" files={filterResult} columns={columns} />
        )
    }
  }
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }
  const handleFilterChange = debounce(() => {
    if (searchValue.length) {
      const filtered = originalData.filter((item) => item.name.includes(searchValue))
      setFilterResult(filtered)
    } else {
      setFilterResult(originalData)
    }
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
      setOriginalData(customResult)
    } catch (error) {}
  }
  useEffect(() => {
    execSearch()
  }, [directoryPath])
  useEffect(() => {
    handleFilterChange()
  }, [searchValue, originalData])
  const handleFilterTypeChange = (value: string) => {
    let filteredResults: FileInfoCustom[]
    if (value == 'All') {
      filteredResults = originalData
    } else {
      filteredResults = originalData.filter((item) => item.type === value)
    }
    setFilterResult(filteredResults)
  }
  return (
    <FileManageContext.Provider
      value={{
        tableChange,
        currentRow,
        filterResult,
        onRowClick,
        onContextMenu,
        onDoubleClick,
        isUsePreview,
        setCurrentView,
        setIsUsePreview,
        hideMenu
      }}
    >
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
            style={{
              width: 120,
              marginLeft: 8
            }}
            defaultValue="All"
            onChange={handleFilterTypeChange}
          >
            {options.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Header>
        <Content
          ref={contextContainerRef}
          onContextMenu={onContextMenu}
          className="file-manage-content"
        >
          <ContextMenu
            getMenus={getMenus}
            isMenuVisible={isMenuVisible}
            menuPosition={menuPosition}
            onRequestClose={hideMenu}
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
    </FileManageContext.Provider>
  )
}
export default FileManage
