import { Button, Checkbox, Col, Input, message, Row } from "antd";
import Directory from "@src/components/file-manage/directory";
import { getIgnorePatterns } from "@src/utils/common";
import { ipcRendererInvoke } from "../../utils/desktop-utils";
import MonacoEditorWrapper from "@src/components/editor/monaco-editor-wrapper";
import React, { useState } from "react";
import RegExpInput from "../antd-wrap/search/reg-exp-input";
import useDirectory from "@src/store/use-directory";
import "@src/style/less/markdown-styles.less";
const FeatureListPage: React.FC = () => {
  const [output, setOutput] = useState(""); // 存储执行结果
  const [isAddSourcePath, setIsAddSourcePath] = useState(false); // 是否添加源路径
  const [filesToExclude, setFilesToExclude] = useState(""); // 要排除的文件列表
  const { directoryPath, isUseIgnoredFiles } = useDirectory();
  const [regExp, setRegExp] = useState<RegExp | null>(null);
  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning("Please select an exec directory.");
      return;
    }
    // 转换搜索查询为正则表达式
    if (!regExp) return;
    const ignoreFilesPatterns = getIgnorePatterns(filesToExclude);
    try {
      // 调用 ipcRendererInvoke 执行搜索
      const result: string = await ipcRendererInvoke(
        "exec-reg-query-batch",
        directoryPath,
        regExp,
        ignoreFilesPatterns,
        isAddSourcePath,
        isUseIgnoredFiles,
      );
      setOutput(result); // 设置执行结果到状态
      message.success("Executed successfully.");
    } catch (error) {
      setOutput("Failed to exec: " + error); // 设置错误信息到状态
      message.error("Failed to exec: " + error);
    }
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
      <h1>File Content Query</h1>
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
          <RegExpInput setRegExp={setRegExp} placeholder="Search Query" />
        </Col>
        <Col span={8}>
          <Checkbox
            checked={isAddSourcePath}
            onChange={(e) => setIsAddSourcePath(e.target.checked)}
            style={{
              marginRight: "10px",
            }}
          >
            Add Source Path
          </Checkbox>
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
          <Button onClick={handleExecute} type="primary">
            Search
          </Button>
        </Col>
      </Row>
      <div
        style={{
          flex: 1,
          width: "100%",
        }}
      >
        <MonacoEditorWrapper value={output} />
      </div>
    </div>
  );
};
export default FeatureListPage;
