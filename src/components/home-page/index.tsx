import React from "react";
import SvgIcon from "@src/components/svg-icon";
import "@src/style/less/home-page.less";
const HomePage: React.FC = () => {
  return (
    <div className="home-container">
      <h1 className="welcome-title">这里是首页</h1>
      <div className="icon-links">
        {/* 添加带有图标的Gitee和GitHub链接 */}
        <a
          href="https://gitee.com/felixzc"
          className="icon-link"
          target="_blank"
          rel="noopener noreferrer"
          title="访问Gitee仓库" // 可以添加title属性作为额外的提示
        >
          <SvgIcon
            svgName="gitee-icon"
            needPointer
            iconSize={24}
            iconColor="#FF0000" // 假设默认颜色为红色
            hoverColor="#00FF00" // 假设悬停颜色为绿色
            toolTipValue="访问Gitee仓库"
          />
        </a>
        <a
          href="https://github.com/FelixZC"
          className="icon-link"
          target="_blank"
          rel="noopener noreferrer"
          title="访问GitHub仓库"
        >
          <SvgIcon
            svgName="github-icon"
            needPointer
            iconSize={24}
            iconColor="#000000" // GitHub图标的默认颜色可能是黑色
            hoverColor="#4078c0" // GitHub图标的悬停颜色可能是蓝色
            toolTipValue="访问GitHub仓库"
          />
        </a>
      </div>
    </div>
  );
};
export default HomePage;
