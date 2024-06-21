import { Button, Checkbox, Col, Input, message, Row, Tooltip } from 'antd'
import { CheckSquareOutlined, CloseSquareOutlined, SearchOutlined } from '@ant-design/icons'
import { convertToReg, getIgnorePatterns } from '@src/utils/common'
import Directory from '@src/components/file-manage/directory'
import { ipcRendererInvoke } from '../../utils/desktop-utils'
import React, { useState } from 'react'
import useDirectory from '@src/store/use-directory'
import '@src/style/less/markdown-styles.less'
import '@src/style/less/icon.less'
import '@src/style/less/pre.less'
const FeatureListPage: React.FC = () => {
  const [output, setOutput] = useState('') // 存储执行结果
  const [isAddSourcePath, setIsAddSourcePath] = useState(false) // 是否添加源路径
  // 新增搜索相关的状态
  const [searchQuery, setSearchQuery] = useState('') // 用户输入的搜索内容
  const [matchCase, setMatchCase] = useState(false) // 是否匹配大小写
  const [matchWholeWord, setMatchWholeWord] = useState(false) // 是否匹配整个单词
  const [matchReg, setMatchReg] = useState(false) // 是否使用正则表达式
  const [filesToExclude, setFilesToExclude] = useState('') // 要排除的文件列表
  const { directoryPath, isUseIgnoredFiles } = useDirectory()

  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning('Please select an exec directory.')
      return
    }
    // 转换搜索查询为正则表达式
    const regExp = convertToReg(searchQuery, matchReg, matchCase, matchWholeWord)
    if (!regExp) return
    const ignoreFilesPatterns = getIgnorePatterns(filesToExclude)
    try {
      // 调用 ipcRendererInvoke 执行搜索
      const result: string = await ipcRendererInvoke(
        'exec-reg-query-batch',
        directoryPath,
        regExp,
        ignoreFilesPatterns,
        isAddSourcePath,
        isUseIgnoredFiles
      )
      setOutput(result) // 设置执行结果到状态
      message.success('Executed successfully.')
    } catch (error) {
      setOutput('Failed to execute: ' + error) // 设置错误信息到状态
      message.error('Failed to execute: ' + error)
    }
  }
  // 图标点击事件处理函数
  const handleMatchCaseChange = () => {
    setMatchCase(!matchCase)
  }
  const handleMatchWholeWordChange = () => {
    setMatchWholeWord(!matchWholeWord)
  }
  const handleUseRegExpChange = () => {
    setMatchReg(!matchReg)
  }
  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h1>File Content Query</h1>

      <Row
        gutter={16}
        style={{
          marginBottom: '10px',
          alignItems: 'center'
        }}
      >
        <Col span={16}>
          <Directory />
        </Col>
      </Row>

      <Row
        gutter={16}
        style={{
          marginBottom: '10px',
          alignItems: 'center'
        }}
      >
        <Col span={16}>
          <Input
            placeholder="Search Query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suffix={
              <div className="icon-container">
                <Tooltip title="Match Case">
                  <SearchOutlined
                    className={`icon-base ${matchCase ? 'icon-selected' : ''}`}
                    onClick={handleMatchCaseChange}
                  />
                </Tooltip>
                <Tooltip title="Match Whole Word">
                  <CheckSquareOutlined
                    className={`icon-base ${matchWholeWord ? 'icon-selected' : ''}`}
                    onClick={handleMatchWholeWordChange}
                  />
                </Tooltip>
                <Tooltip title="Use Regular Expression">
                  <CloseSquareOutlined
                    className={`icon-base ${matchReg ? 'icon-selected' : ''}`}
                    onClick={handleUseRegExpChange}
                  />
                </Tooltip>
              </div>
            }
            style={{
              width: '100%'
            }}
          />
        </Col>
        <Col span={8}>
          <Checkbox
            checked={isAddSourcePath}
            onChange={(e) => setIsAddSourcePath(e.target.checked)}
            style={{
              marginRight: '10px'
            }}
          >
            Add Source Path
          </Checkbox>
        </Col>
      </Row>

      <Row
        gutter={16}
        style={{
          marginBottom: '10px',
          alignItems: 'center'
        }}
      >
        <Col span={16}>
          <Input
            placeholder="Files to Exclude (comma separated)"
            value={filesToExclude}
            onChange={(e) => setFilesToExclude(e.target.value)}
          />
        </Col>
        <Col span={8}>
          <Button onClick={handleExecute} type="primary">
            Search
          </Button>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <div
            style={{
              width: '100%',
              height: 'calc(100vh - 240px)',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}
          >
            {/* 使用pre标签来显示纯文本输出 */}
            <pre contentEditable>{output}</pre>
          </div>
        </Col>
      </Row>
    </div>
  )
}
export default FeatureListPage
