// Loading.tsx
import React from "react";
import "@src/style/less/loading.less"; // 引入样式

interface LoadingProps {
  size?: number; // 自定义大小
  className?: string; // 自定义类名
}

const Loading: React.FC<LoadingProps> = ({ size = 50, className = "" }) => {
  const spinnerSize = size; // 使用 props 中的 size 或默认值
  const spinnerClass = `loading-spinner ${className}`; // 合并默认类名和自定义类名

  return (
    <div className="loading-container">
      <div
        className={spinnerClass}
        style={{ width: spinnerSize, height: spinnerSize }}
      />
    </div>
  );
};

export default Loading;
