import { Progress } from "antd";
import React from "react";
export interface ProgressProps {
  value: number;
  isVisible: boolean;
  isReset: boolean;
}
const ProgressBar: React.FC<ProgressProps> = ({
  value,
  isVisible,
  isReset,
}) => {
  return (
    <div>
      {isVisible && (
        <Progress
          percent={value}
          strokeWidth={18}
          status={isReset ? "active" : "success"}
        />
      )}
    </div>
  );
};
export default ProgressBar;
