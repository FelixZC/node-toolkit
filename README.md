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

#### 项目目录结构说明
```
pzc-toolbox                                             //
├─ .cz-config.js                                        //
├─ .editorconfig                                        //
├─ .eslintignore                                        //
├─ .eslintrc.js                                         //
├─ .husky                                               //
│  ├─ commit-msg                                        //
│  ├─ pre-commit                                        //
│  └─ _                                                 //
│     └─ husky.sh                                       //
├─ .vscode                                              //
│  └─ launch.json                                       //
├─ commitlint.config.js                                 //
├─ LICENSE                                              //
├─ package-lock.json                                    //
├─ package.json                                         //
├─ prettier.config.js                                   //
├─ README.md                                            //
├─ src                                                  //
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
│  │  │  ├─ create-object-array-in-switch-by-old.ts     //操作switch中对象数组
│  │  │  ├─ czl.ts                                      //
│  │  │  ├─ depart-default-export-object-express.ts     //重置导出
│  │  │  ├─ depart-switch.ts                            //分离switch
│  │  │  ├─ extract-annotation.ts                       //提取注释
│  │  │  ├─ get-all-function-name.ts                    //获取单一文件方法名
│  │  │  ├─ import-sort.ts                              //导入排序
│  │  │  ├─ move-default-export-to-last.ts              //移动默认导出
│  │  │  ├─ remove-invalid-comment.ts                   //移除包含this的无效注释
│  │  │  ├─ search-button-obj.ts                        //查询按钮对象
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
│  │  ├─ use-js-codemod.ts                              //codemod使用包装
│  │  ├─ use-postcss-plugin.ts                          //postcss使用包装
│  │  ├─ use-posthtml-plugin.ts                         //posthtml使用包装
│  │  ├─ use-vue-codemod.ts                             //vue-codemod使用包装
│  │  ├─ vuecodemods                                    //codemode-vue集合
│  │  │  ├─ add-import.ts                               //
│  │  │  ├─ ast-utils.ts                                //jscodemod工具方法集合
│  │  │  ├─ define-component.ts                         //
│  │  │  ├─ import-composition-api-from-vue.ts          //
│  │  │  ├─ index.ts                                    //
│  │  │  ├─ new-directive-api.ts                        //
│  │  │  ├─ new-global-api.ts                           //
│  │  │  ├─ new-vue-to-create-app.ts                    //
│  │  │  ├─ noop.ts                                     //
│  │  │  ├─ remove-contextualh-from-render.ts           //
│  │  │  ├─ remove-extraneous-import.ts                 //
│  │  │  ├─ remove-production-tip.ts                    //
│  │  │  ├─ remove-trivial-root.ts                      //
│  │  │  ├─ remove-vue-use.ts                           //
│  │  │  ├─ root-prop-to-use.ts                         //
│  │  │  ├─ scoped-slots-to-slots.ts                    //
│  │  │  ├─ vue-as-namespace-import.ts                  //
│  │  │  ├─ vue-class-component-v8.ts                   //
│  │  │  ├─ vue-router-v4.ts                            //
│  │  │  ├─ vue-transformation.ts                       //
│  │  │  └─ vuex-v4.ts                                  //
│  │  └─ wrap-ast-transformation.ts                     //
│  ├─ query                                             //查询结果和文件输出
│  │  ├─ excel                                          //
│  │  │  └─ test.json                                   //
│  │  ├─ js                                             //
│  │  │  └─ stote-state.js                              //
│  │  ├─ json                                           //
│  │  │  ├─ excel-object-list.json                      //
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
│     ├─ excel                                          //excel相关
│     │  ├─ excel-to-json.ts                            //
│     │  ├─ exec                                        //
│     │  │  ├─ run-excel-to-json.ts                     //
│     │  │  └─ run-json-to-excel.ts                     //
│     │  ├─ json-to-excel.ts                            //
│     │  ├─ output                                      //
│     │  │  └─ index.ts                                 //
│     │  ├─ typing                                      //
│     │  │  └─ type.d.ts                                //
│     │  └─ utils                                       //
│     │     └─ map.ts                                   //
│     ├─ fs.ts                                          //文件系统相关
│     ├─ md.ts                                          //文档相关
│     └─ type.ts                                        //接口模板相关
└─ tsconfig.json                                        //

```
