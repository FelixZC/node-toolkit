// 假设 require.context 函数已经被 webpack 正确设置，并且你可以这样使用它
// 这里我们使用 any 类型作为参数和返回值的类型，因为我们没有 webpack 的类型定义
const requireAll = (requireContext: any) => {
  return requireContext.keys().map(requireContext)
}

// 使用 require.context 加载 './icons' 目录下所有以 '.svg' 结尾的文件
// 这里我们同样使用 any 类型，因为我们没有具体的类型定义
const svgList = require.context('../assets/icons', false, /\.svg$/)

// 调用 requireAll 函数加载所有找到的 .svg 文件
const svgModules = requireAll(svgList)
