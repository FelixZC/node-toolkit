const requireAll = (requireContext: any) => {
  return requireContext.keys().map(requireContext);
};
const svgList = require.context("../assets/icons", false, /\.svg$/);
const svgModules = requireAll(svgList);
