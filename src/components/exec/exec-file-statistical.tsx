import { Button, message, Tooltip } from 'antd'
import { ipcRendererInvoke } from '../../utils/desktop-utils'
import MonacoEditor from 'react-monaco-editor'
import React, { useEffect, useState } from 'react'
import { SwapOutlined } from '@ant-design/icons'
import Directory from '@src/components/file-manage/directory'
import useDirectory from '@src/store/use-directory'
import '@src/style/less/icon.less'
const FeatureListPage: React.FC = () => {
  const [output, setOutput] = useState('') // 存储执行结果
  const [isShowInJson, setIsShowInJson] = useState(false)
  const [resultJson, setResultJson] = useState('')
  const [resultMd, setResultMd] = useState('')
  const { directoryPath, isUseIgnoredFiles } = useDirectory()
  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning('Please select an exec directory.')
      return
    }
    try {
      // 假设这里是执行功能并返回结果的代码
      const result = await ipcRendererInvoke(
        'exec-file-statistical',
        directoryPath,
        isUseIgnoredFiles
      )
      setResultJson(result.resultJson)
      setResultMd(result.resultMd)
      setOutput(isShowInJson ? result.resultJson : result.resultMd) // 设置执行结果到状态
      message.success('Executed successfully.')
    } catch (error) {
      setOutput('Failed to execute: ' + error) // 设置错误信息到状态
      message.error('Failed to execute: ' + error)
    }
  }

  const toggleOutputFormat = () => {
    setIsShowInJson(!isShowInJson)
  }
  useEffect(() => {
    setOutput(isShowInJson ? resultJson : resultMd)
  }, [isShowInJson])

  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h1>File Statistical</h1>
      <div
        style={{
          display: 'flex',
          marginBottom: '10px',
          width: '100%'
        }}
      >
        <div style={{ flex: 1 }}>
          <Directory />
        </div>
        <Button
          onClick={handleExecute}
          style={{
            marginLeft: '10px'
          }}
        >
          Exec
        </Button>
        <Tooltip title="Toggle Output Format">
          <Button
            onClick={toggleOutputFormat}
            style={{
              marginLeft: '10px',
              color: '#1890ff',
              borderColor: '#1890ff'
            }}
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
          readOnly: true,
          // 使编辑器只读
          minimap: {
            enabled: true
          },
          // 禁用迷你地图
          folding: true,
          // 启用代码折叠
          showFoldingControls: 'always',
          // 总是显示折叠控件
          foldingStrategy: 'auto',
          // 根据缩进进行折叠策略
          scrollBeyondLastLine: false,
          // 禁用滚动到文档末尾之后
          overviewRulerLanes: 3,
          // 预览标尺的行数
          overviewRulerBorder: false,
          // 预览标尺的边框
          glyphMargin: true,
          // 启用字形边距，用于显示断点等
          lineDecorationsWidth: 10,
          // 行装饰的宽度
          lineNumbers: 'on',
          // 行号显示
          lineNumbersMinChars: 4,
          // 行号最少字符数
          fixedOverflowWidgets: true,
          // 溢出的部件（如缩进线）固定
          renderLineHighlight: 'all',
          // 整行高亮显示
          scrollbar: {
            // 滚动条的配置
            vertical: 'auto',
            // 垂直滚动条为自动
            horizontal: 'auto',
            // 水平滚动条为自动
            useShadows: true,
            // 滚动条阴影
            verticalHasArrows: false,
            // 垂直滚动条箭头
            horizontalHasArrows: false,
            // 水平滚动条箭头
            alwaysConsumeMouseWheel: false // 总是响应鼠标滚轮
          },
          mouseWheelZoom: false,
          // 禁用鼠标滚轮缩放
          quickSuggestions: false,
          // 禁用快速建议
          formatOnType: false,
          // 输入时不自动格式化
          formatOnPaste: false,
          // 粘贴时不自动格式化
          autoClosingBrackets: 'always',
          // 自动补全括号
          autoIndent: 'full',
          // 自动缩进
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
