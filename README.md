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
10. excel 与 json 互相转化
11. 文件批量重命名和复制粘贴移动

未完待续...

#### 收集的插件模板:

[ast 转化编译原理](https://github.com/jamiebuilds/the-super-tiny-compiler.git)

[astexplorer 语法树格式化网站](https://astexplorer.net/)

[babel 插件编写手册中文文档](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook)

[js-codemod 模板来源](https://github.com/cpojer/js-codemod.git)

[vue-codemod 模板来源](https://github.com/vuejs/vue-codemod.git)

[react-codemod 模板来源](https://github.com/reactjs/react-codemod.git)

#### 使用

npm i 安装依赖

tsc -p ./ 编译转化

node dist/src/xxx 执行

ps:将目标文件夹放到工程目录下，自行修改 new fsUtils(rootPath)

待添加执行进度条和自动格式化...
