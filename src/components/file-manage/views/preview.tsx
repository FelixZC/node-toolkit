import CodeMirror from "@uiw/react-codemirror";
import { ipcRendererInvoke } from "@src/utils/desktop-utils";
import React, { memo, useEffect, useState } from "react";
import { Resizable, ResizeCallback } from "re-resizable";
import type { FileInfoCustom } from "@src/types/file";
const CodeMirrorMemo = React.memo(CodeMirror);
interface Props {
  previewFile: FileInfoCustom | null;
  className?: string;
}
const Priview: React.FC<Props> = ({ previewFile, className }) => {
  const [fileContent, setFileContent] = useState("");
  const [width, setWidth] = useState<number>(200);
  const getFileContent = async () => {
    if (previewFile && !(previewFile.type === "Folder")) {
      const content = await ipcRendererInvoke(
        "read-file",
        previewFile.filePath,
      );
      setFileContent(content || "");
    }
  };
  useEffect(() => {
    getFileContent();
  }, [previewFile]);
  const onResize: ResizeCallback = (event, direction, elementRef, delta) => {
    setWidth(width + delta.width);
  };
  return (
    <Resizable
      className={className}
      size={{
        width: width,
      }}
      enable={{
        left: true,
      }}
      onResizeStop={onResize}
    >
      <div>
        {previewFile ? (
          <CodeMirrorMemo
            value={fileContent}
            height="calc(100vh - 70px)"
            theme={"light"}
            readOnly={true}
            editable={false}
          />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "calc(100vh - 70px)",
            }}
          >
            <p
              style={{
                textAlign: "center",
              }}
            >
              No Content.
            </p>
          </div>
        )}
      </div>
    </Resizable>
  );
};
export default memo(Priview);
