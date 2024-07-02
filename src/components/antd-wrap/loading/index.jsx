import { LoadingOutlined } from "@ant-design/icons";
import React from "react";
import { Spin } from "antd";
const antIcon = (
  <LoadingOutlined
    style={{
      fontSize: 24,
    }}
    spin
  />
);
const Loading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      // 使用视口高度来使容器占满整个屏幕高度
      margin: 0,
      backgroundColor: "white", // 根据需要设置背景颜色
    }}
  >
    <Spin indicator={antIcon} />
  </div>
);
export default Loading;
