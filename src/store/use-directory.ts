import { directorySlice } from "@src/slices/directory-slice"; // 假设你已经导出了 slice
import { RootState } from "@src/store";
import { useDispatch, useSelector } from "react-redux";
const useDirectory = () => {
  const dispatch = useDispatch();
  const { directoryPath, isUseIgnoredFiles } = useSelector(
    (state: RootState) => state.directory,
  );
  // 看看这个值是否随dispatch更新
  // 使用 Redux Toolkit 的 action creators
  const setDirectoryPath = (path: string) =>
    dispatch(directorySlice.actions.setDirectoryPath(path));
  const setUseIgnoredFiles = (ignoreFiles: boolean) =>
    dispatch(directorySlice.actions.setUseIgnoredFiles(ignoreFiles));
  return {
    directoryPath,
    isUseIgnoredFiles,
    setDirectoryPath,
    setUseIgnoredFiles,
  };
};
export default useDirectory;
