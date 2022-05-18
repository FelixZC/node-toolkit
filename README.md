# pzc 的工具箱

#### 介绍

pzc 的工具箱，包含：

1. babel 插件以及执行器
2. jscodemod 插件以及执行器
3. posthtml 插件以及执行器
4. postcss 插件以及执行器
5. swigger 转 ts 声明文件以及请求模板生成
6. 项目注释提取和文档生成
7. 文件夹信息统计和分类
8. 文件内容正则匹配、替换和去重
9. 文本格式化
10. 文件批量重命名和复制粘贴移动

未完待续...

#### 收集的插件模板:

[ast 转化编译原理](https://github.com/jamiebuilds/the-super-tiny-compiler)

[astexplorer 语法树格式化网站](https://astexplorer.net/)

[babel 插件编写手册](https://github.com/jamiebuilds/babel-handbook)

[js-codemod 模板来源](https://github.com/cpojer/js-codemod)

[vue-codemod 模板来源](https://github.com/vuejs/vue-codemod)

[react-codemod 模板来源](https://github.com/reactjs/react-codemod)

#### 使用

npm i 安装依赖

ts-node xxx执行

ps:自行在src/exec/index.ts修改new fsUtils(rootPath)，rootPath为预执行目标文件夹目录
