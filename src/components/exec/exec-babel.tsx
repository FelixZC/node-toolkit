import { Button, List, message, Switch } from "antd";
import Directory from "@src/components/file-manage/directory";
import { ipcRendererInvoke } from "../../utils/desktop-utils";
import React, { useState } from "react";
import useDirectory from "@src/store/use-directory";
import "@src/style/less/icon.less";
interface Feature {
  id: number;
  name: string;
  isSelected: boolean;
  path: string;
}
const initialFeatures: Feature[] = [
  {
    id: 4,
    name: "import-sort",
    isSelected: false,
    path: "../plugins/babel-plugins/import-sort",
  },
  {
    id: 5,
    name: "move-default-export-to-last",
    isSelected: false,
    path: "../plugins/babel-plugins/move-default-export-to-last",
  },
  {
    id: 8,
    name: "sort-object-array-by-index",
    isSelected: false,
    path: "../plugins/babel-plugins/sort-object-array-by-index",
  },
  {
    id: 10,
    name: "transform-remove-console",
    isSelected: false,
    path: "../plugins/babel-plugins/transform-remove-console",
  },
];
const FeatureListPage: React.FC = () => {
  const [features, setFeatures] = useState(initialFeatures);
  const { directoryPath, isUseIgnoredFiles } = useDirectory();

  // 切换所有功能的选中状态
  const handleSelectRevert = () => {
    const newFeatures = features.map((f) => ({
      ...f,
      isSelected: !f.isSelected,
    }));
    setFeatures(newFeatures);
  };
  const handleSelectAll = () => {
    const newFeatures = features.map((f) => ({
      ...f,
      isSelected: true,
    }));
    setFeatures(newFeatures);
  };
  const handleSelectNone = () => {
    const newFeatures = features.map((f) => ({
      ...f,
      isSelected: false,
    }));
    setFeatures(newFeatures);
  };

  // 切换单个功能的选中状态
  const handleSelectFeature = (featureId: number, isSelected: boolean) => {
    const newFeatures = features.map((f) =>
      f.id === featureId
        ? {
            ...f,
            isSelected,
          }
        : f,
    );
    setFeatures(newFeatures);
  };

  // 执行选中的功能
  const handleExecute = async () => {
    if (!directoryPath.length) {
      message.warning("Please select a exec derecroty.");
      return;
    }
    const selectedFeatures = features.filter((f) => f.isSelected);
    if (selectedFeatures.length === 0) {
      message.warning("Please select at least one feature to exec.");
      return;
    }
    const babelPathList = selectedFeatures.map((f) => f.path);
    try {
      await ipcRendererInvoke(
        "exec-babel",
        directoryPath,
        babelPathList,
        isUseIgnoredFiles,
      );
      message.success(
        `Executing: ${selectedFeatures.map((f) => f.name).join(", ")}`,
      );
    } catch (error) {
      message.error("Failed to exec: " + error);
    }
  };
  return (
    <div
      style={{
        padding: "20px",
      }}
    >
      <h1>Babel Plugin List Execution Page</h1>
      <Directory />
      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        <Button onClick={handleSelectRevert}>Toggle Select Revert</Button>
        <Button onClick={handleSelectAll}>Toggle Select on </Button>
        <Button onClick={handleSelectNone}>Toggle Select off</Button>
        <Button onClick={handleExecute}>Exec</Button>
      </div>
      {/* 功能列表 */}
      <List
        bordered
        dataSource={features}
        renderItem={(feature) => (
          <List.Item
            actions={[
              <Switch
                // 使用受控组件的形式
                checked={feature.isSelected}
                onChange={(checked) => handleSelectFeature(feature.id, checked)}
              />,
              <Button
                type="link"
                onClick={() =>
                  handleSelectFeature(feature.id, !feature.isSelected)
                }
              >
                {feature.isSelected ? "Deselect" : "Select"}
              </Button>,
            ]}
          >
            {feature.name}
          </List.Item>
        )}
      />
    </div>
  );
};
export default FeatureListPage;
