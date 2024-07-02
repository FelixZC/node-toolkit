import { Input, message, Tooltip } from "antd";
import { ipcRendererInvoke } from "../../utils/desktop-utils";
import React from "react";
import { SettingOutlined } from "@ant-design/icons";
import useDirectory from "@src/store/use-directory";
import "@src/style/less/icon.less";
const DirectorySelect: React.FC = (Props) => {
  const {
    directoryPath,
    isUseIgnoredFiles,
    setDirectoryPath,
    setUseIgnoredFiles,
  } = useDirectory();
  const handleChooseDirectory = async () => {
    try {
      const filePaths = await ipcRendererInvoke("choose-directory");
      if (filePaths && filePaths.length > 0) {
        setDirectoryPath(filePaths[0]);
        message.success("Directory chosen: " + filePaths[0]);
      }
    } catch (error) {
      message.error("Failed to choose directory: " + error);
    }
  };
  const handleUseIgnoreFiles = () => {
    setUseIgnoredFiles(!isUseIgnoredFiles);
  };
  return (
    <div>
      <Input.Search
        placeholder="Directory Path"
        value={directoryPath}
        readOnly
        onSearch={handleChooseDirectory}
        suffix={
          <Tooltip title="Use Ignore Files">
            <SettingOutlined
              className={`icon-base ${isUseIgnoredFiles ? "icon-selected" : ""}`}
              onClick={handleUseIgnoreFiles}
            />
          </Tooltip>
        }
      />
    </div>
  );
};
export default React.memo(DirectorySelect);
