import { Button, message, Tooltip } from "antd";
import Directory from "@src/components/file-manage/directory";
import { ipcRendererInvoke } from "../../utils/desktop-utils";
import MonacoEditor, {
  EditorDidMount,
  EditorWillUnmount,
} from "react-monaco-editor";
import React, { useEffect, useState } from "react";
import { SwapOutlined } from "@ant-design/icons";
import useDirectory from "@src/store/use-directory";
import "@src/style/less/icon.less";
const MemoizedMonacoEditor = React.memo(MonacoEditor);
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
  type ParametersType<T> = T extends (...args: infer U) => any ? U : never;
  type ChangeParams = ParametersType<EditorDidMount>;
  type IStandaloneCodeEditor = ChangeParams[0];
  const handleResize = (editor: IStandaloneCodeEditor) => {
    editor.layout();
  };
  const editorDidMount: EditorDidMount = (editor) => {
    window.addEventListener("resize", handleResize.bind(window, editor));
  };
  const editorWillUnmount: EditorWillUnmount = (editor) => {
    window.removeEventListener("resize", handleResize.bind(window, editor));
  };
  return (
    <div
      style={{
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
      <MemoizedMonacoEditor
        width="100%"
        height="calc(100vh - 120px)"
        language="json"
        theme="vs"
        value={output}
        editorDidMount={editorDidMount}
        editorWillUnmount={editorWillUnmount}
        options={{
          readOnly: true,
        }}
      />
    </div>
  );
};
export default FeatureListPage;
