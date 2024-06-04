import React, { useState, useEffect } from 'react'
import { List, Input, Button, Switch, message } from 'antd'
import { ipcRendererInvoke } from '../../utils/desktop-utils'
interface Feature {
  id: number
  name: string
  isSelected: boolean
  path: string
}

const initialFeatures: Feature[] = [
  {
    id: 0,
    name: 'property-sort',
    isSelected: false,
    path: '../plugins/postcss-plugins/property-sort'
  }
]

const FeatureListPage: React.FC = () => {
  const [features, setFeatures] = useState(initialFeatures)
  const [directoryPath, setDirectoryPath] = useState('') // 存储目录路径

  // 切换所有功能的选中状态
  const handleSelectRevert = () => {
    const newFeatures = features.map((f) => ({ ...f, isSelected: !f.isSelected }))
    setFeatures(newFeatures)
  }
  const handleSelectAll = () => {
    const newFeatures = features.map((f) => ({ ...f, isSelected: true }))
    setFeatures(newFeatures)
  }
  const handleSelectNone = () => {
    const newFeatures = features.map((f) => ({ ...f, isSelected: false }))
    setFeatures(newFeatures)
  }

  // 切换单个功能的选中状态
  const handleSelectFeature = (featureId: number, isSelected: boolean) => {
    const newFeatures = features.map((f) => (f.id === featureId ? { ...f, isSelected } : f))
    setFeatures(newFeatures)
  }

  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning('Please select a exec derecroty.')
      return
    }
    const selectedFeatures = features.filter((f) => f.isSelected)
    if (selectedFeatures.length === 0) {
      message.warning('Please select at least one feature to execute.')
      return
    }
    const postcssList = selectedFeatures.map((f) => f.path)
    try {
      await ipcRendererInvoke('exec-postcss', directoryPath, postcssList)
      message.success(`Executing: ${selectedFeatures.map((f) => f.name).join(', ')}`)
    } catch (error) {
      message.error('Failed to execute: ' + error)
    }
  }
  // 选择目录
  const handleChooseDirectory = async () => {
    try {
      const filePaths = await ipcRendererInvoke('choose-directory')
      if (filePaths && filePaths.length > 0) {
        setDirectoryPath(filePaths[0]) // 设置目录路径到状态
        message.success('Directory chosen: ' + filePaths[0])
        sessionStorage.setItem('directoryPath', filePaths[0])
      }
    } catch (error) {
      message.error('Failed to choose directory: ' + error)
    }
  }

  // 组件加载完毕后执行的方法
  useEffect(() => {
    setDirectoryPath(sessionStorage.getItem('directoryPath') || '')
  }, []) // 空依赖数组表示这个effect只在挂载时运行一次

  return (
    <div style={{ padding: '20px' }}>
      <h1>Feature List Execution Page</h1>
      {/* 显示目录路径的Input组件 */}
      <Input.Search
        placeholder="Directory Path"
        value={directoryPath}
        readOnly
        onSearch={handleChooseDirectory}
      />
      {/* 功能列表 */}
      <List
        bordered
        dataSource={features}
        renderItem={(feature) => (
          <List.Item
            actions={[
              <Switch
                // 使用受控组件的形式
                checked={feature.isSelected}
                onChange={(checked) => handleSelectFeature(feature.id, checked)}
              />,
              <Button
                type="link"
                onClick={() => handleSelectFeature(feature.id, !feature.isSelected)}
              >
                {feature.isSelected ? 'Deselect' : 'Select'}
              </Button>
            ]}
          >
            {feature.name}
          </List.Item>
        )}
      />
      <div style={{ marginTop: '20px' }}>
        <Button onClick={handleSelectRevert}>Toggle Select Revert</Button>
        <Button onClick={handleSelectAll}>Toggle Select on </Button>
        <Button onClick={handleSelectNone}>Toggle Select off</Button>
        <Button onClick={handleExecute}>Exec</Button>
      </div>
    </div>
  )
}

export default FeatureListPage