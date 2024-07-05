import { Button, message, Tooltip } from "antd";
import Directory from "@src/components/file-manage/directory";
import { ipcRendererInvoke } from "../../utils/desktop-utils";
import MonacoEditorWrapper from "@src/components/editor/monaco-editor-wrapper";
import React, { useEffect, useState } from "react";
import { SwapOutlined } from "@ant-design/icons";
import useDirectory from "@src/store/use-directory";
import "@src/style/less/icon.less";
const FeatureListPage: React.FC = () => {
  const [output, setOutput] = useState("");
  const [isShowInJson, setIsShowInJson] = useState(false);
  const [resultJson, setResultJson] = useState("");
  const [resultMd, setResultMd] = useState("");
  const { directoryPath, isUseIgnoredFiles } = useDirectory();
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning("Please select an exec directory.");
      return;
    }
    try {
      const result = await ipcRendererInvoke(
        "exec-file-statistical",
        directoryPath,
        isUseIgnoredFiles,
      );
      setResultJson(result.resultJson);
      setResultMd(result.resultMd);
      setOutput(isShowInJson ? result.resultJson : result.resultMd);
      message.success("Executed successfully.");
    } catch (error) {
      setOutput("Failed to exec: " + error);
      message.error("Failed to exec: " + error);
    }
  };
  const toggleOutputFormat = () => {
    setIsShowInJson(!isShowInJson);
  };
  useEffect(() => {
    setOutput(isShowInJson ? resultJson : resultMd);
  }, [isShowInJson]);
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
      <h1>File Statistical</h1>
      <div
        style={{
          display: "flex",
          marginBottom: "10px",
          width: "100%",
        }}
      >
        <div
          style={{
            flex: 1,
          }}
        >
          <Directory />
        </div>
        <Button
          onClick={handleExecute}
          style={{
            marginLeft: "10px",
          }}
        >
          Exec
        </Button>
        <Tooltip title="Toggle Output Format">
          <Button
            onClick={toggleOutputFormat}
            style={{
              marginLeft: "10px",
              color: "#1890ff",
              borderColor: "#1890ff",
            }}
            icon={<SwapOutlined />}
          ></Button>
        </Tooltip>
      </div>
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
