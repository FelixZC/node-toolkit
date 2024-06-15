import AceEditor from 'react-ace'
import { Button, message, Tooltip } from 'antd'
import { ipcRendererInvoke } from '../../utils/desktop-utils'
import React, { useEffect, useRef, useState } from 'react'
import 'ace-builds/src-noconflict/ext-searchbox'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/mode-markdown'
import 'ace-builds/src-noconflict/ext-language_tools'
import { EditOutlined, EyeOutlined, SplitCellsOutlined } from '@ant-design/icons'
import gfm from 'remark-gfm'
import ReactMarkdown from 'react-markdown'
import '@src/style/less/markdown-styles.less'
import 'github-markdown-css/github-markdown.css'
import '@src/style/less/icon.less'
import Directory from '@src/components/file-manage/directory'
import useDirectory from '@src/store/use-directory'
const FeatureListPage: React.FC = () => {
  const [output, setOutput] = useState('') // 存储执行结果
  const [mode, setMode] = useState('split') // 控制编辑器和预览器的显示模式
  const { directoryPath, isUseIgnoredFiles } = useDirectory()

  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning('Please select an exec directory.')
      return
    }
    try {
      // 假设这里是执行功能并返回结果的代码
      const result: string = await ipcRendererInvoke(
        'exec-get-attrs-and-annotation',
        directoryPath,
        isUseIgnoredFiles
      )
      setOutput(result) // 设置执行结果到状态
      message.success('Executed successfully.')
    } catch (error) {
      setOutput('Failed to execute: ' + error) // 设置错误信息到状态
      message.error('Failed to execute: ' + error)
    }
  }

  // 组件加载完毕后执行的方法
  useEffect(() => {
    const editor = editorRef.current?.editor
    if (editor) {
      editor.renderer.setShowGutter(true)
      editor.session.setMode('ace/mode/markdown')
    }
  }, []) // 空依赖数组表示这个effect只在挂载时运行一次

  const editorRef = useRef<AceEditor>(null)
  const outputHandleChange = (newContent: string) => {
    // 更新组件状态以反映编辑器中的内容
    setOutput(newContent)
  }
  const handleModeChange = (value: string) => {
    setMode(value)
  }

  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h1>Get Project Attribute Annotation</h1>
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
        {/* 自定义模式切换工具栏 */}
        <div
          style={{
            marginLeft: '10px'
          }}
        >
          <Tooltip title="编辑模式">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleModeChange('edit')}
              style={{
                marginLeft: '5px'
              }}
            />
          </Tooltip>
          <Tooltip title="拆分模式">
            <Button
              icon={<SplitCellsOutlined />}
              onClick={() => handleModeChange('split')}
              style={{
                marginLeft: '5px'
              }}
            />
          </Tooltip>
          <Tooltip title="预览模式">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleModeChange('preview')}
              style={{
                marginLeft: '5px'
              }}
            />
          </Tooltip>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          height: 'calc(100vh - 160px)'
        }}
      >
        {(mode == 'split' || mode == 'edit') && (
          <AceEditor
            ref={editorRef}
            placeholder="请输入Markdown内容..."
            mode="markdown"
            theme="github"
            name="UNIQUE_ID_OF_EDITOR"
            value={output}
            onChange={outputHandleChange}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2
            }}
            style={{
              flex: 1,
              height: '100%',
              width: '100%'
            }}
            editorProps={{
              $blockScrolling: true
            }}
          />
        )}
        {(mode == 'split' || mode == 'preview') && (
          <div
            style={{
              flex: 1,
              height: '100%',
              width: '100%',
              overflow: 'auto'
            }}
          >
            <ReactMarkdown remarkPlugins={[gfm]} className="markdown-body">
              {output}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
export default FeatureListPage
