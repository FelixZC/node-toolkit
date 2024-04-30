// 配置文件导出对象
module.exports = {
  // 定义代码运行的环境
  env: {
    browser: true, // 浏览器环境
    es2021: true, // ES2021标准
    node: true // Node.js环境
  },
  extends: [
    // 'airbnb-base', // 扩展自airbnb-base的规则，此处已注释
    'plugin:prettier/recommended' // 扩展自prettier的推荐规则
  ],
  // 解析器设置
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest', // 支持最新的ECMAScript标准
    sourceType: 'module' // 模块源类型设置为ES模块
  },
  // 使用的插件
  plugins: ['@typescript-eslint'],
  // 自定义的规则
  rules: {
    'import/no-unresolved': 'off', // 关闭import路径未解析的警告
    'import/extensions': 'off' // 关闭对import路径后缀的警告
  }
}
