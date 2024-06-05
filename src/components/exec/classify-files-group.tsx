import React, { useState, useEffect } from 'react'
import { Input, Button, message } from 'antd'
import { ipcRendererInvoke } from '../../utils/desktop-utils'
import MonacoEditor from 'react-monaco-editor'

const FeatureListPage: React.FC = () => {
  const [directoryPath, setDirectoryPath] = useState('') // 存储目录路径
  const [output, setOutput] = useState('') // 存储执行结果

  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning('Please select an exec directory.')
      return
    }
    try {
      // 假设这里是执行功能并返回结果的代码
      const result = await ipcRendererInvoke('classify-files-group', directoryPath)
      setOutput(result) // 设置执行结果到状态
      message.success('Executed successfully.')
    } catch (error) {
      setOutput('Failed to execute: ' + error) // 设置错误信息到状态
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
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <h1>Feature List Execution Page</h1>

      {/* 显示目录路径的Input组件 */}
      <div style={{ display: 'flex', marginBottom: '20px', width: '100%' }}>
        <Input.Search
          placeholder="Directory Path"
          value={directoryPath}
          readOnly
          onSearch={handleChooseDirectory}
          style={{ flex: 1 }}
        />
        <Button onClick={handleExecute} style={{ marginLeft: '10px' }}>
          Exec
        </Button>
      </div>

      {/* 显示执行结果的Monaco Editor组件 */}
      <MonacoEditor
        width="100%"
        height="calc(100vh - 160px)" // 根据需要调整这个值
        language="json" // 可以是json, javascript, css, html等
        theme="vs" // 编辑器主题
        value={output}
        options={{
          readOnly: true, // 如果你希望编辑器是只读的
          minimap: { enabled: true }, // 禁用迷你地图
          folding: true, // 启用代码折叠
          showFoldingControls: 'mouseover', // 总是显示折叠控件
          foldingStrategy: 'indentation', // 根据缩进进行折叠
          scrollBeyondLastLine: false
        }}
        onChange={(editorValue) => {
          // 编辑器内容变化时的回调，这里我们不需要它，因为设置为只读
        }}
      />

      {/* 功能列表 */}
      {/* 你的功能列表代码放在这里 */}
    </div>
  )
}

export default FeatureListPage
