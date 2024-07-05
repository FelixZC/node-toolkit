import { debounce } from "lodash";
import MonacoEditor, {
  EditorDidMount,
  EditorWillUnmount,
  MonacoEditorProps,
} from "react-monaco-editor";
import React, { useEffect, useState } from "react";
type ParametersType<T> = T extends (...args: infer U) => any ? U : never;
type ChangeParams = ParametersType<EditorDidMount>;
type IStandaloneCodeEditor = ChangeParams[0];
const MemoizedMonacoEditor = React.memo(MonacoEditor);
const CustomMonacoEditor: React.FC<MonacoEditorProps> = (props) => {
  const [editorRef, setEditorRef] = useState<IStandaloneCodeEditor | null>(
    null,
  );
  const handleWindowResize = debounce(() => {
    editorRef && editorRef.layout();
  }, 100);
  const handleParentDomResize = debounce(() => {
    //MonacoEditor监听的resize，只能这样了
    window.dispatchEvent(new Event("resize"));
    editorRef && editorRef.layout();
  }, 100);
  const resizeObserver = new ResizeObserver((entries, observer) => {
    handleParentDomResize();
  });
  const editorDidMount: EditorDidMount = (editor) => {
    setEditorRef(editor);
    resizeObserver.observe(editor.getContainerDomNode().parentElement!);
  };
  const editorWillUnmount: EditorWillUnmount = (editor) => {
    editor.dispose();
    resizeObserver.unobserve(editor.getContainerDomNode().parentElement!);
    resizeObserver.disconnect();
  };
  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [editorRef]);
  return (
    <MemoizedMonacoEditor
      width="100%"
      height="100%"
      language="json"
      theme="vs"
      options={{
        readOnly: true,
      }}
      editorDidMount={editorDidMount}
      editorWillUnmount={editorWillUnmount}
      {...props}
    />
  );
};
export default React.memo(CustomMonacoEditor);
