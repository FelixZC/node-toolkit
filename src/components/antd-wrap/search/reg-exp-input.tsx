// RegExpInput.tsx
import React, { useEffect, useState } from "react";
import { Input, Tooltip } from "antd";
import {
  CheckSquareOutlined,
  CloseSquareOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { convertToReg } from "@src/utils/common";
import "@src/style/less/icon.less";

interface RegExpInputProps {
  setRegExp: (reg: RegExp | null) => void;
  placeholder?: string;
  size?: "small" | "middle" | "large" | undefined;
  className?: string;
}

const RegExpInput: React.FC<RegExpInputProps> = ({
  setRegExp,
  placeholder,
  size,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState(""); // 用户输入的搜索内容
  const [matchCase, setMatchCase] = useState(false); // 是否匹配大小写
  const [matchWholeWord, setMatchWholeWord] = useState(false); // 是否匹配整个单词
  const [matchReg, setMatchReg] = useState(false); // 是否使用正则表达式

  useEffect(() => {
    const regExp = convertToReg(
      searchQuery,
      matchReg,
      matchCase,
      matchWholeWord,
    );
    setRegExp(regExp);
  }, [searchQuery, matchReg, matchCase, matchWholeWord]);

  return (
    <Input
      className={className}
      size={size ? size : "middle"}
      placeholder={placeholder ? placeholder : "Type Some Words"}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      suffix={
        <div className="icon-container">
          <Tooltip title="Match Case">
            <SearchOutlined
              className={`icon-base ${matchCase ? "icon-selected" : ""}`}
              onClick={() => setMatchCase(!matchCase)}
            />
          </Tooltip>
          <Tooltip title="Match Whole Word">
            <CheckSquareOutlined
              className={`icon-base ${matchWholeWord ? "icon-selected" : ""}`}
              onClick={() => setMatchWholeWord(!matchWholeWord)}
            />
          </Tooltip>
          <Tooltip title="Use Regular Expression">
            <CloseSquareOutlined
              className={`icon-base ${matchReg ? "icon-selected" : ""}`}
              onClick={() => setMatchReg(!matchReg)}
            />
          </Tooltip>
        </div>
      }
      style={{ width: "100%" }}
    />
  );
};

export default RegExpInput;
