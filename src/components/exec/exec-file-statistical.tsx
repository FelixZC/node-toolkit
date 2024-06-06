import React, { useState, useEffect } from 'react'
import { Input, Button, message, Tooltip } from 'antd'
import { ipcRendererInvoke } from '../../utils/desktop-utils'
import MonacoEditor from 'react-monaco-editor'
import { SwapOutlined } from '@ant-design/icons'

const FeatureListPage: React.FC = () => {
  const [directoryPath, setDirectoryPath] = useState('') // 存储目录路径
  const [output, setOutput] = useState('') // 存储执行结果
  const [isShowInJson, setIsShowInJson] = useState(false)
  const [resultJson, setResultJson] = useState('')
  const [resultMd, setResultMd] = useState('')
  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning('Please select an exec directory.')
      return
    }
    try {
      // 假设这里是执行功能并返回结果的代码
      const result = await ipcRendererInvoke('exec-file-statistical', directoryPath)
      setResultJson(result.resultJson)
      setResultMd(result.resultMd)
      setOutput(isShowInJson ? result.resultJson : result.resultMd) // 设置执行结果到状态
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

  const toggleOutputFormat = () => {
    setIsShowInJson(!isShowInJson)
  }

  useEffect(() => {
    setOutput(isShowInJson ? resultJson : resultMd)
  }, [isShowInJson])

  useEffect(() => {
    console.log('current isShowInJson state', isShowInJson)
    console.log('output has been updated to:', output)
  }, [output])

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <h1>File Statistical</h1>

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
        <Tooltip title="Toggle Output Format">
          <Button
            onClick={toggleOutputFormat}
            style={{ marginLeft: '10px', color: '#1890ff', borderColor: '#1890ff' }}
            icon={<SwapOutlined />}
          ></Button>
        </Tooltip>
      </div>
      {/* 显示执行结果的Monaco Editor组件 */}
      <MonacoEditor
        width="100%"
        height="calc(100vh - 160px)" // 根据需要调整这个值
        language="json" // 可以是json, javascript, css, html等
        theme="vs" // 编辑器主题
        value={output}
        options={{
          readOnly: true, // 使编辑器只读
          minimap: { enabled: true }, // 禁用迷你地图
          folding: true, // 启用代码折叠
          showFoldingControls: 'always', // 总是显示折叠控件
          foldingStrategy: 'auto', // 根据缩进进行折叠策略
          scrollBeyondLastLine: false, // 禁用滚动到文档末尾之后
          overviewRulerLanes: 3, // 预览标尺的行数
          overviewRulerBorder: false, // 预览标尺的边框
          glyphMargin: true, // 启用字形边距，用于显示断点等
          lineDecorationsWidth: 10, // 行装饰的宽度
          lineNumbers: 'on', // 行号显示
          lineNumbersMinChars: 4, // 行号最少字符数
          fixedOverflowWidgets: true, // 溢出的部件（如缩进线）固定
          renderLineHighlight: 'all', // 整行高亮显示
          scrollbar: {
            // 滚动条的配置
            vertical: 'auto', // 垂直滚动条为自动
            horizontal: 'auto', // 水平滚动条为自动
            useShadows: true, // 滚动条阴影
            verticalHasArrows: false, // 垂直滚动条箭头
            horizontalHasArrows: false, // 水平滚动条箭头
            alwaysConsumeMouseWheel: false // 总是响应鼠标滚轮
          },
          mouseWheelZoom: false, // 禁用鼠标滚轮缩放
          quickSuggestions: false, // 禁用快速建议
          formatOnType: false, // 输入时不自动格式化
          formatOnPaste: false, // 粘贴时不自动格式化
          autoClosingBrackets: 'always', // 自动补全括号
          autoIndent: 'full', // 自动缩进
          dragAndDrop: true // 启用拖放功能
        }}
        onChange={(editorValue) => {
          // 编辑器内容变化时的回调，这里我们不需要它，因为设置为只读
        }}
      />
    </div>
  )
}

export default FeatureListPage
