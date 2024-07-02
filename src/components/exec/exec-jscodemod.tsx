import { Button, List, message, Switch } from "antd";
import { ipcRendererInvoke } from "../../utils/desktop-utils";
import React, { useState } from "react";
import "@src/style/less/icon.less";
import Directory from "@src/components/file-manage/directory";
import useDirectory from "@src/store/use-directory";
interface Feature {
  id: number;
  name: string;
  isSelected: boolean;
  path: string;
}
const initialFeatures: Feature[] = [
  {
    id: 1,
    name: "arrow-function",
    isSelected: false,
    path: "../plugins/jscodemods/arrow-function",
  },
  {
    id: 3,
    name: "no-vars",
    isSelected: false,
    path: "../plugins/jscodemods/no-vars",
  },
  {
    id: 4,
    name: "object-shorthand",
    isSelected: false,
    path: "../plugins/jscodemods/object-shorthand",
  },
  {
    id: 5,
    name: "rm-object-assign",
    isSelected: false,
    path: "../plugins/jscodemods/rm-object-assign",
  },
  {
    id: 6,
    name: "rm-requires",
    isSelected: false,
    path: "../plugins/jscodemods/rm-requires",
  },
  {
    id: 7,
    name: "template-literals",
    isSelected: false,
    path: "../plugins/jscodemods/template-literals",
  },
  {
    id: 8,
    name: "unchain-variables",
    isSelected: false,
    path: "../plugins/jscodemods/unchain-variables",
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
    const jscodemodList = selectedFeatures.map((f) => f.path);
    try {
      await ipcRendererInvoke(
        "exec-jscodemod",
        directoryPath,
        jscodemodList,
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
      <h1>Jscodemod Plugin List Execution Page</h1>
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
