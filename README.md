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
9. 文本去重
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

#### 项目配置及源代码目录结构概览
```
├─ .cz-config.js        // Commitizen 配置文件，用于自定义提交信息的格式，提升Git提交信息的规范性。
├─ .editorconfig        // 编辑器配置文件，帮助开发者在不同编辑器和IDE之间保持一致的代码风格。
├─ .eslintignore        // ESLint 忽略规则文件，指定ESLint在代码检查时应忽略的文件或目录。
├─ .eslintrc.js         // ESLint 配置文件，定义了代码质量检查的规则集，用于统一代码风格和规范。
├─ .husky               // Husky 目录，存放Git钩子脚本的配置。
│  ├─ commit-msg        // Git钩子脚本之一，用于在提交信息被提交前进行校验或修改，常与commitlint配合使用以规范提交信
│  ├─ pre-commit        // Git钩子脚本，在Git预提交阶段执行，常用于自动格式化代码、运行测试等，确保提交前代码符合团队规
│  └─ _                 // （此目录命名不太常见，可能是误写或特有配置）
│     └─ husky.sh       // Husky的Shell脚本入口，可能用于跨平台兼容性处理或自定义钩子逻辑。
├─ .vscode              // Visual Studio Code工作区配置目录。
│  └─ launch.json       // VSCode调试配置文件，定义了如何启动和配置调试会话，适用于Node.js或其他语言环境。
├─ commitlint.config.js // CommitLint配置文件，用于定义提交信息的验证规则，与Husky的commit-msg钩子配合使用。
├─ LICENSE              // 许可证文件，声明了项目使用的开源许可证类型，明确了用户使用、修改和分发代码的权利与义务。
├─ package-lock.json    // npm生成的锁定文件，记录了项目依赖的具体版本号，确保安装时的一致性和复现性。
├─ package.json         // Node.js项目的元数据文件，包含了项目名称、版本、依赖、脚本等信息。
├─ prettier.config.js   // Prettier配置文件，规定了代码格式化的规则，帮助保持团队间的代码风格统一。
├─ README.md            // 项目自述文件，通常包含项目简介、安装步骤、使用方法、贡献指南等重要信息。
└─ src                  // 源代码目录。
│  ├─ exec                                              //执行器集合
│  │  ├─ classify-files-group.ts                        //文件信息统计
│  │  ├─ exec-bable-plugin.ts                           //执行babel插件
│  │  ├─ exec-create-request-template.ts                //创建请求模板
│  │  ├─ exec-get-attrs-and-annotation.ts               //获取项目注释
│  │  ├─ exec-get-component-description.ts              //获取组件描述
│  │  ├─ exec-jscodemod.ts                              //执行jscodemode
│  │  ├─ exec-postcss-plugin.ts                         //执行postcss
│  │  ├─ exec-posthtml-plugin.ts                        //posthtml
│  │  ├─ exec-reg-query.ts                              //执行正则查询
│  │  ├─ exec-transfer-file-name-To-kebab-case.ts       //文件名驼峰转化
│  │  ├─ exec-update-document.ts                        //更新查询结果
│  │  └─ index.ts                                       //方法集合
│  ├─ plugins                                           //插件集合
│  │  ├─ babel-plugins                                  //babel插件
│  │  │  ├─ ast-utils.ts                                //babel工具方法集合
│  │  │  ├─ depart-default-export-object-express.ts     //重置导出
│  │  │  ├─ depart-switch.ts                            //分离switch
│  │  │  ├─ extract-annotation.ts                       //提取注释
│  │  │  ├─ get-all-function-name.ts                    //获取单一文件方法名
│  │  │  ├─ import-sort.ts                              //导入排序
│  │  │  ├─ move-default-export-to-last.ts              //移动默认导出
│  │  │  ├─ remove-invalid-comment.ts                   //移除包含this的无效注释
│  │  │  ├─ replace-memberExpress-object-or-property.ts //替换表达式的调用对象或者调用属性
│  │  │  ├─ sort-object-array-by-index.ts               //对象数组按index排序
│  │  │  ├─ transfer-file-name-tok-kebab-case.ts        //驼峰转化
│  │  │  └─ transform-remove-console.ts                 //移除打印
│  │  ├─ common.d.ts                                    //通用插件类型定义
│  │  ├─ generate-vue-docs                              //文档生成
│  │  │  ├─ index.ts                                    //提取信息
│  │  │  └─ render.ts                                   //生成文档
│  │  ├─ jscodemods                                     //codemode集合
│  │  │  ├─ arrow-function-arguments.ts                 //简化箭头参数
│  │  │  ├─ arrow-function.ts                           //转化箭头函数
│  │  │  ├─ no-reassign-params.ts                       //不使用函数参数同一命名
│  │  │  ├─ no-vars.ts                                  //移除全局定义
│  │  │  ├─ object-shorthand.ts                         //简化对象属性
│  │  │  ├─ rm-object-assign.ts                         //移除对象注册
│  │  │  ├─ rm-requires.ts                              //移除无效请求
│  │  │  ├─ template-literals.ts                        //转化模板字符串
│  │  │  └─ unchain-variables.ts                        //断开链式定义
│  │  ├─ postcss-plugins                                //postcss插件集合
│  │  │  └─ transfer-file-name-tok-kebab-case.ts        //驼峰转化
│  │  ├─ posthtml-plugins                               //posthtml插件集合
│  │  │  ├─ property-sort.ts                            //属性排序
│  │  │  ├─ query-tag.ts                                //查询标签
│  │  │  └─ transfer-file-name-tok-kebab-case.ts        //驼峰转化
│  │  ├─ sfc-utils.ts                                   //@vue/compiler-sfc封装方法集合
│  │  ├─ use-babel-plugin.ts                            //Babel插件使用包装
│  │  ├─ use-codemod.ts                                 //codemod使用包装
│  │  ├─ use-postcss-plugin.ts                          //postcss使用包装
│  │  ├─ use-posthtml-plugin.ts                         //posthtml使用包装
│  ├─ query                                             //查询结果和文件输出
│  │  ├─ js                                             //
│  │  │  └─ stote-state.js                              //
│  │  ├─ json                                           //
│  │  │  ├─ file-list.json                              //
│  │  │  ├─ files-group.json                            //
│  │  │  ├─ function-name.json                          //
│  │  │  ├─ global-extra.json                           //
│  │  │  ├─ new-object-cache.json                       //
│  │  │  └─ same-object-cache.json                      //
│  │  └─ md                                             //
│  └─ utils                                             //工具集合
│     ├─ cli-progress.ts                                //进度条
│     ├─ common.ts                                      //通用方法
│     ├─ fs.ts                                          //文件系统相关
│     ├─ md.ts                                          //文档相关
│     └─ type.ts                                        //接口模板相关
└─ tsconfig.json                                        //
```
