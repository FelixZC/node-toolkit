import { directorySlice } from "@src/slices/directory-slice";
import { RootState } from "@src/store";
import { useDispatch, useSelector } from "react-redux";
const useDirectory = () => {
  const dispatch = useDispatch();
  const { directoryPath, isUseIgnoredFiles } = useSelector(
    (state: RootState) => state.directory,
  );

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
