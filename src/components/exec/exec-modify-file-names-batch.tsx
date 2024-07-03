import { Button, Col, Input, message, Modal, Row, Tooltip } from "antd";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { getIgnorePatterns } from "@src/utils/common";
import { ipcRendererInvoke } from "../../utils/desktop-utils";
import React, { useState } from "react";
import "@src/style/less/markdown-styles.less";
import "@src/style/less/icon.less";
import Directory from "@src/components/file-manage/directory";
import useDirectory from "@src/store/use-directory";
import RegExpInput from "../antd-wrap/search/reg-exp-input";
import type {
  ModifyResultReturnType,
  PriviewResultReturnType,
} from "@src/exec/exec-modify-file-names-batch";

import MonacoEditorWrapper from "@src/components/editor/monaco-editor-wrapper";

const FeatureListPage: React.FC = () => {
  const [output, setOutput] = useState(""); // 存储执行结果
  const [replaceFilename, setReplaceFilename] = useState(""); //用户想要替换的内容
  const [replaceExtname, setReplaceExtname] = useState(""); //用户想要替换的内容
  const [filesToExclude, setFilesToExclude] = useState(""); // 要排除的文件列表
  const [addTimeStamp, setAddTimeStamp] = useState(false); // 文件名是否添加时间戳
  const [addDateTime, setAddDateTime] = useState(false); //文件名是否添加时间秒onds
  const { directoryPath, isUseIgnoredFiles } = useDirectory();
  const [filenameReg, setFilenameReg] = useState<RegExp | null>(null);
  const [extnameReg, setExtnameReg] = useState<RegExp | null>(null);
  //处理预览结果
  const handlePreview = async () => {
    if (!directoryPath.length) {
      message.warning("Please select an exec directory.");
      return;
    }
    const ignoreFilesPatterns = getIgnorePatterns(filesToExclude);
    if (filenameReg && !replaceFilename.length) {
      message.warning("Please enter the filename to replace.");
      return;
    }
    if (!filenameReg && replaceFilename.length) {
      message.warning("Please enter the valid filename to search.");
      return;
    }
    if (extnameReg && !replaceExtname.length) {
      message.warning("Please enter the extension to replace.");
      return;
    }
    if (!extnameReg && replaceExtname.length) {
      message.warning("Please enter the valid extension to search.");
      return;
    }
    try {
      // 调用 ipcRendererInvoke 执行预览
      const result: PriviewResultReturnType = await ipcRendererInvoke(
        "exec-modify-file-names-batch-priview",
        directoryPath,
        {
          filename: replaceFilename,
          extname: replaceExtname,
          filenameReg,
          extnameReg,
          ignoreFilesPatterns,
          addTimeStamp,
          addDateTime,
        },
        isUseIgnoredFiles,
      );
      const { changeCount, changeRecords } = result;
      let str = "";
      if (changeCount > 0) {
        str += `Total files : ${changeCount} Will change\n`;
        changeRecords.forEach((record) => {
          str += `${record.oldFilePath} \n -> ${record.newFilePath}\n\n`;
        });
      } else {
        str += "No files will be modified.";
      }
      setOutput(str);
    } catch (error) {
      setOutput("Failed to exec: " + error); // 设置错误信息到状态
      message.error("Failed to exec: " + error);
    }
  };
  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning("Please select an exec directory.");
      return;
    }
    const ignoreFilesPatterns = getIgnorePatterns(filesToExclude);
    // 检查输入条件
    if (filenameReg && !replaceFilename.length) {
      message.warning("Please enter the filename to replace.");
      return;
    }
    if (!filenameReg && replaceFilename.length) {
      message.warning("Please enter the filename to search.");
      return;
    }
    if (extnameReg && !replaceExtname.length) {
      message.warning("Please enter the extension to replace.");
      return;
    }
    if (!extnameReg && replaceExtname.length) {
      message.warning("Please enter the extension to search.");
      return;
    }
    // 弹出确认对话框
    Modal.confirm({
      title: "Confirm Execution",
      content:
        "This is an irreversible step, so make sure you're prepared and backup your data.",
      okText: "All Right",
      cancelText: "Think More",
      async onOk() {
        // 用户点击确定后执行的操作
        try {
          // 调用 ipcRendererInvoke 执行搜索
          const result: ModifyResultReturnType = await ipcRendererInvoke(
            "exec-modify-file-names-batch",
            directoryPath,
            {
              filename: replaceFilename,
              extname: replaceExtname,
              filenameReg,
              extnameReg,
              ignoreFilesPatterns,
              addTimeStamp,
              addDateTime,
            },
            isUseIgnoredFiles,
          );
          const { changeCount, changeRecords } = result;
          let str = "";
          str += `Total files changed: ${changeCount}\n`;
          str += changeRecords.map((record) => {
            const { oldFilePath, newFilePath } = record;
            return `${oldFilePath} \n -> ${newFilePath}\n\n`;
          });
          setOutput(str); // 设置执行结果到状态
          message.success("Executed successfully.");
        } catch (error) {
          setOutput("Failed to exec: " + error); // 设置错误信息到状态
          message.error("Failed to exec: " + error);
        }
      },
      onCancel() {
        // 用户点击取消后的操作，这里可以不做任何事情
      },
    });
  };
  // 图标点击事件处理函数
  const handleAddTimeStamp = () => {
    setAddTimeStamp(!addTimeStamp);
  };
  const handleAddDateTime = () => {
    setAddDateTime(!addDateTime);
  };
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h1>Modify Filename Batch</h1>
      <Row
        gutter={16}
        style={{
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <Col span={16}>
          <Directory />
        </Col>
      </Row>
      <Row
        gutter={16}
        style={{
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <Col span={16}>
          <RegExpInput
            setRegExp={setFilenameReg}
            placeholder="Search Filename"
          />
        </Col>
      </Row>
      <Row
        gutter={16}
        style={{
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <Col span={16}>
          <Input
            placeholder="Replace"
            value={replaceFilename}
            onChange={(e) => setReplaceFilename(e.target.value)}
            suffix={
              <div className="icon-container">
                <Tooltip title="Add TimeStamp">
                  <ClockCircleOutlined
                    className={`icon-base ${addTimeStamp ? "icon-selected" : ""}`}
                    onClick={handleAddTimeStamp}
                  />
                </Tooltip>
                <Tooltip title="Add DateTime">
                  <CalendarOutlined
                    className={`icon-base ${addDateTime ? "icon-selected" : ""}`}
                    onClick={handleAddDateTime}
                  />
                </Tooltip>
              </div>
            }
          />
        </Col>
      </Row>
      <Row
        gutter={16}
        style={{
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <Col span={16}>
          <RegExpInput setRegExp={setExtnameReg} placeholder="Search Extname" />
        </Col>
      </Row>
      <Row
        gutter={16}
        style={{
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <Col span={16}>
          <Input
            placeholder="Replace"
            value={replaceExtname}
            onChange={(e) => setReplaceExtname(e.target.value)}
          />
        </Col>
      </Row>
      <Row
        gutter={16}
        style={{
          marginBottom: "10px",
          alignItems: "center",
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
          <Button onClick={handlePreview} type="primary">
            Preview
          </Button>
          <Button
            onClick={handleExecute}
            type="primary"
            style={{
              marginLeft: "10px",
            }}
          >
            Replace
          </Button>
        </Col>
      </Row>
      <div style={{ flex: 1, width: "100%" }}>
        <MonacoEditorWrapper value={output} />
      </div>
    </div>
  );
};
export default FeatureListPage;
