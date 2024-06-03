const requireAll = (requireContext: any) => {
  return requireContext.keys().map(requireContext)
}

// 使用 require.context 加载 './icons' 目录下所有以 '.svg' 结尾的文件
const svgList = require.context('../assets/icons', false, /\.svg$/)

// 调用 requireAll 函数加载所有找到的 .svg 文件
const svgModules = requireAll(svgList)
