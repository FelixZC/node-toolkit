import React, { useState } from 'react'
import { List, Input, Button, Switch, message } from 'antd'
import { ipcRendererInvoke } from '@src/utils/desktop-utils'

interface Feature {
  id: number
  name: string
  isSelected: boolean
}

const initialFeatures: Feature[] = [
  { id: 1, name: 'Feature 1', isSelected: false },
  { id: 2, name: 'Feature 2', isSelected: false }
  // ... 其他功能
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
  const handleExecute = () => {
    const selectedFeatures = features.filter((f) => f.isSelected)
    if (selectedFeatures.length === 0) {
      message.warning('Please select at least one feature to execute.')
      return
    }
    // 这里模拟执行操作，实际中可能需要调用API或执行其他逻辑
    message.success(`Executing: ${selectedFeatures.map((f) => f.name).join(', ')}`)
  }

  // 选择目录
  const handleChooseDirectory = async () => {
    try {
      const filePaths = await ipcRendererInvoke('choose-directory')
      if (filePaths && filePaths.length > 0) {
        setDirectoryPath(filePaths[0]) // 设置目录路径到状态
        message.success('Directory chosen: ' + filePaths[0])
      }
    } catch (error) {
      message.error('Failed to choose directory: ' + error)
    }
  }

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
