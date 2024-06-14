import React, { useState, useEffect } from 'react'
import { Input, Tooltip, Button, Row, Col, message, Modal } from 'antd'
import {
  SearchOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { ipcRendererInvoke } from '../../utils/desktop-utils'
import { getIgnorePatterns, convertToReg } from '@src/utils/common'
import type {
  ModifyResultReturnType,
  PriviewResultReturnType
} from '@src/exec/exec-modify-file-names-batch'
import '@src/style/less/markdown-styles.less'
import '@src/style/less/icon.less'
import '@src/style/less/pre.less'
const FeatureListPage: React.FC = () => {
  const [directoryPath, setDirectoryPath] = useState('') // 存储目录路径
  const [output, setOutput] = useState('') // 存储执行结果
  const [filenameQuery, setFilenameQuery] = useState('') // 用户输入的搜索内容
  const [replaceFilename, setReplaceFilename] = useState('') //用户想要替换的内容
  const [filenameMatchCase, setFilenameMatchCase] = useState(false) // 是否匹配大小写
  const [filenameMatchWholeWord, setFilenameMatchWholeWord] = useState(false) // 是否匹配整个单词
  const [filenameMatchReg, setFilenameMatchReg] = useState(false) // 是否使用正则表达式

  const [extnameQuery, setExtnameQuery] = useState('') // 用户输入的扩展名搜索内容
  const [replaceExtname, setReplaceExtname] = useState('') //用户想要替换的内容
  const [extnameMatchCase, setExtnameMatchCase] = useState(false) // 是否匹配大小写
  const [extnameMatchWholeWord, setExtnameMatchWholeWord] = useState(false) // 是否匹配整个单词
  const [extnameMatchReg, setExtnameMatchReg] = useState(false) // 是否使用正则表达式

  const [filesToExclude, setFilesToExclude] = useState('') // 要排除的文件列表

  const [addTimeStamp, setAddTimeStamp] = useState(false) // 文件名是否添加时间戳
  const [addDateTime, setAddDateTime] = useState(false) //文件名是否添加时间秒onds
  const [isUseIgnoredFiles, setIsUseIgnoredFiles] = useState(false)

  //处理预览结果
  const handlePreview = async () => {
    if (!directoryPath.length) {
      message.warning('Please select an exec directory.')
      return
    }
    // 转换搜索查询为正则表达式
    const filenameReg = convertToReg(
      filenameQuery,
      filenameMatchReg,
      filenameMatchCase,
      filenameMatchWholeWord
    )
    const extnameReg = convertToReg(
      extnameQuery,
      extnameMatchReg,
      extnameMatchCase,
      extnameMatchWholeWord
    )
    const ignoreFilesPatterns = getIgnorePatterns(filesToExclude)
    if (filenameReg && !replaceFilename.length) {
      message.warning('Please enter the filename to replace.')
      return
    }
    if (!filenameReg && replaceFilename.length) {
      message.warning('Please enter the valid filename to search.')
      return
    }
    if (extnameReg && !replaceExtname.length) {
      message.warning('Please enter the extension to replace.')
      return
    }
    if (!extnameReg && replaceExtname.length) {
      message.warning('Please enter the valid extension to search.')
      return
    }
    try {
      // 调用 ipcRendererInvoke 执行预览
      const result: PriviewResultReturnType = await ipcRendererInvoke(
        'exec-modify-file-names-batch-priview',
        directoryPath,
        {
          filename: replaceFilename,
          extname: replaceExtname,
          filenameReg,
          extnameReg,
          ignoreFilesPatterns,
          addTimeStamp,
          addDateTime
        },
        isUseIgnoredFiles
      )
      const { changeCount, changeRecords } = result
      let str = ''
      if (changeCount > 0) {
        str += `Total files : ${changeCount} Will change\n`
        changeRecords.forEach((record) => {
          str += `${record.oldFilePath} \n -> ${record.newFilePath}\n\n`
        })
      } else {
        str += 'No files will be modified.'
      }
      setOutput(str)
    } catch (error) {
      setOutput('Failed to execute: ' + error) // 设置错误信息到状态
      message.error('Failed to execute: ' + error)
    }
  }

  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning('Please select an exec directory.')
      return
    }
    // 转换搜索查询为正则表达式
    const filenameReg = convertToReg(
      filenameQuery,
      filenameMatchReg,
      filenameMatchCase,
      filenameMatchWholeWord
    )
    const extnameReg = convertToReg(
      extnameQuery,
      extnameMatchReg,
      extnameMatchCase,
      extnameMatchWholeWord
    )
    const ignoreFilesPatterns = getIgnorePatterns(filesToExclude)

    // 检查输入条件
    if (filenameReg && !replaceFilename.length) {
      message.warning('Please enter the filename to replace.')
      return
    }
    if (!filenameReg && replaceFilename.length) {
      message.warning('Please enter the filename to search.')
      return
    }
    if (extnameReg && !replaceExtname.length) {
      message.warning('Please enter the extension to replace.')
      return
    }
    if (!extnameReg && replaceExtname.length) {
      message.warning('Please enter the extension to search.')
      return
    }

    // 弹出确认对话框
    Modal.confirm({
      title: 'Confirm Execution',
      content: "This is an irreversible step, so make sure you're prepared and backup your data.",
      okText: 'All Right',
      cancelText: 'Think More',
      async onOk() {
        // 用户点击确定后执行的操作
        try {
          // 调用 ipcRendererInvoke 执行搜索
          const result: ModifyResultReturnType = await ipcRendererInvoke(
            'exec-modify-file-names-batch',
            directoryPath,
            {
              filename: replaceFilename,
              extname: replaceExtname,
              filenameReg,
              extnameReg,
              ignoreFilesPatterns,
              addTimeStamp,
              addDateTime
            },
            isUseIgnoredFiles
          )
          const { changeCount, changeRecords } = result
          let str = ''
          str += `Total files changed: ${changeCount}\n`
          str += changeRecords.map((record) => {
            const { oldFilePath, newFilePath } = record
            return `${oldFilePath} \n -> ${newFilePath}\n\n`
          })

          setOutput(str) // 设置执行结果到状态
          message.success('Executed successfully.')
        } catch (error) {
          setOutput('Failed to execute: ' + error) // 设置错误信息到状态
          message.error('Failed to execute: ' + error)
        }
      },
      onCancel() {
        // 用户点击取消后的操作，这里可以不做任何事情
      }
    })
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
    setIsUseIgnoredFiles(sessionStorage.getItem('isUseIgnoredFiles') === 'true')
  }, []) // 空依赖数组表示这个effect只在挂载时运行一次

  // 图标点击事件处理函数
  const handleFilenameMatchCaseChange = () => {
    setFilenameMatchCase(!filenameMatchCase)
  }

  const handleFilenameMatchWholeWordChange = () => {
    setFilenameMatchWholeWord(!filenameMatchWholeWord)
  }

  const handleFilenameMatchRegChange = () => {
    setFilenameMatchReg(!filenameMatchReg)
  }

  const handleExtnameMatchCaseChange = () => {
    setExtnameMatchCase(!extnameMatchCase)
  }

  const handleExtnameMatchWholeWordChange = () => {
    setExtnameMatchWholeWord(!extnameMatchWholeWord)
  }

  const handleExtnameMatchRegChange = () => {
    setExtnameMatchReg(!extnameMatchReg)
  }

  // 图标点击事件处理函数
  const handleAddTimeStamp = () => {
    setAddTimeStamp(!addTimeStamp)
  }

  const handleAddDateTime = () => {
    setAddDateTime(!addDateTime)
  }

  const handleUseIgnoreFiles = () => {
    setIsUseIgnoredFiles(!isUseIgnoredFiles)
    sessionStorage.setItem('isUseIgnoredFiles', String(!isUseIgnoredFiles))
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <h1>Modify Filename Batch</h1>
      <Row gutter={16} style={{ marginBottom: '10px', alignItems: 'center' }}>
        <Col span={16}>
          <Input.Search
            placeholder="Directory Path"
            value={directoryPath}
            readOnly
            onSearch={handleChooseDirectory}
            style={{ width: '100%' }}
            suffix={
              <Tooltip title="Use Ignore Files">
                <SettingOutlined
                  className={`icon-base ${isUseIgnoredFiles ? 'icon-selected' : ''}`}
                  onClick={handleUseIgnoreFiles}
                />
              </Tooltip>
            }
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: '10px', alignItems: 'center' }}>
        <Col span={16}>
          <Input
            placeholder="Search Filename"
            value={filenameQuery}
            onChange={(e) => setFilenameQuery(e.target.value)}
            suffix={
              <div className="icon-container">
                <Tooltip title="Match Case">
                  <SearchOutlined
                    className={`icon-base ${filenameMatchCase ? 'icon-selected' : ''}`}
                    onClick={handleFilenameMatchCaseChange}
                  />
                </Tooltip>
                <Tooltip title="Match Whole Word">
                  <CheckSquareOutlined
                    className={`icon-base ${filenameMatchWholeWord ? 'icon-selected' : ''}`}
                    onClick={handleFilenameMatchWholeWordChange}
                  />
                </Tooltip>
                <Tooltip title="Use Regular Expression">
                  <CloseSquareOutlined
                    className={`icon-base ${filenameMatchReg ? 'icon-selected' : ''}`}
                    onClick={handleFilenameMatchRegChange}
                  />
                </Tooltip>
              </div>
            }
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: '10px', alignItems: 'center' }}>
        <Col span={16}>
          <Input
            placeholder="Replace"
            value={replaceFilename}
            onChange={(e) => setReplaceFilename(e.target.value)}
            suffix={
              <div className="icon-container">
                <Tooltip title="Add TimeStamp">
                  <ClockCircleOutlined
                    className={`icon-base ${addTimeStamp ? 'icon-selected' : ''}`}
                    onClick={handleAddTimeStamp}
                  />
                </Tooltip>
                <Tooltip title="Add DateTime">
                  <CalendarOutlined
                    className={`icon-base ${addDateTime ? 'icon-selected' : ''}`}
                    onClick={handleAddDateTime}
                  />
                </Tooltip>
              </div>
            }
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: '10px', alignItems: 'center' }}>
        <Col span={16}>
          <Input
            placeholder="Search Extname"
            value={extnameQuery}
            onChange={(e) => setExtnameQuery(e.target.value)}
            suffix={
              <div className="icon-container">
                <Tooltip title="Match Case">
                  <SearchOutlined
                    className={`icon-base ${extnameMatchCase ? 'icon-selected' : ''}`}
                    onClick={handleExtnameMatchCaseChange}
                  />
                </Tooltip>
                <Tooltip title="Match Whole Word">
                  <CheckSquareOutlined
                    className={`icon-base ${extnameMatchWholeWord ? 'icon-selected' : ''}`}
                    onClick={handleExtnameMatchWholeWordChange}
                  />
                </Tooltip>
                <Tooltip title="Use Regular Expression">
                  <CloseSquareOutlined
                    className={`icon-base ${extnameMatchReg ? 'icon-selected' : ''}`}
                    onClick={handleExtnameMatchRegChange}
                  />
                </Tooltip>
              </div>
            }
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: '10px', alignItems: 'center' }}>
        <Col span={16}>
          <Input
            placeholder="Replace"
            value={replaceExtname}
            onChange={(e) => setReplaceExtname(e.target.value)}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: '10px', alignItems: 'center' }}>
        <Col span={16}>
          <Input
            placeholder="Files to Exclude (comma separated)"
            value={filesToExclude}
            onChange={(e) => setFilesToExclude(e.target.value)}
          />
        </Col>
        <Col span={8}>
          <Button onClick={handlePreview} type="primary">
            Preview
          </Button>
          <Button onClick={handleExecute} type="primary" style={{ marginLeft: '10px' }}>
            Replace
          </Button>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <div
            style={{
              width: '100%',
              height: 'calc(100vh - 360px)',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}
          >
            {/* 使用pre标签来显示纯文本输出 */}
            <pre>{output}</pre>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default FeatureListPage
