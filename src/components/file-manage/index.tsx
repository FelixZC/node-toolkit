import Checkbox from "antd/es/checkbox/Checkbox";
import ContextMenu from "@src/components/antd-wrap/menus/index";
import debounce from "lodash/debounce";
import { enhancedCompare } from "@src/utils/common";
import FileManageContext from "./context";
import getMenus from "./config/menus";
import getTableColunm from "./config/table-column";
import IconView from "./views/icon-view";
import { ipcRendererInvoke } from "@src/utils/desktop-utils";
import { Layout, Select, TableProps } from "antd";
import Loading from "@src/components/common/loading"; // 引入 Loading 组件
import options from "./config/options";
import Preview from "./views/preview";
import React, { useEffect, useRef, useState } from "react";
import RegExpInput from "../antd-wrap/search/reg-exp-input";
import TableView from "./views/table-view";
import useContextMenu from "@src/components/antd-wrap/menus/use-context-menu";
import useDirectory from "@src/store/use-directory";
import "@src/style/less/file-manage.less";
import type {
  FileInfoCustom,
  FileInfoWithStats,
  FileType,
} from "@src/types/file";
type ParametersType<T> = T extends (...args: infer U) => any ? U : never;
type TableChangeType = TableProps<FileInfoCustom>["onChange"];
type ChangeParams = ParametersType<TableChangeType>;
export type SortConfigType = ChangeParams[2];
type FileTypeExtend = FileType | "All";
const { Header, Content, Footer } = Layout;
const { Option } = Select;
const FileManage: React.FC = () => {
  const { directoryPath, isUseIgnoredFiles, setUseIgnoredFiles } =
    useDirectory();
  const [searchReg, setSearchReg] = useState<RegExp | null>(null);
  const [originalData, setOriginalData] = useState<FileInfoCustom[]>([]);
  const [showData, setShowData] = useState<FileInfoCustom[]>([]);
  const [currentView, setCurrentView] = useState<string>("detail");
  const [isUsePreview, setIsUsePreview] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<FileInfoCustom | null>(null);
  const [currentRow, setCurrentRow] = useState<FileInfoCustom | null>(null);
  const contextContainerRef = useRef<HTMLDivElement>(null);
  const { isMenuVisible, menuPosition, showMenu, hideMenu } = useContextMenu();
  const [isShowLoading, setIsShowLoading] = React.useState(false);
  // 添加过滤类型和排序配置的状态
  const [filterType, setFilterType] = useState<FileTypeExtend>("All");
  const [sortConfig, setSortConfig] = useState<SortConfigType>([]);
  const [lockOrder, setLockOrder] = React.useState<"ascend" | "descend">(
    "ascend",
  );

  // 处理表格排序变化
  const handleTableSortChange = (sorter: SortConfigType) => {
    const localSorter = Array.isArray(sorter) ? sorter : [sorter];
    if (localSorter.every((item) => item.order === "ascend")) {
      setLockOrder("ascend");
    } else if (localSorter.every((item) => item.order === "descend")) {
      setLockOrder("descend");
    }
    setSortConfig(localSorter);
  };
  const filterDataByFileType = (
    data: FileInfoCustom[],
    type: FileTypeExtend,
  ) => {
    if (type === "All") return data;
    return data.filter((item) => item.type === type);
  };
  const sortData = (data: FileInfoCustom[], sorter: SortConfigType) => {
    let localSorter = Array.isArray(sorter) ? sorter : [sorter];
    const isNeedOrder = localSorter.some((item) => item.order);
    if (!isNeedOrder) {
      return data;
    }
    let sortedData = [...data];
    localSorter.forEach((curSorter, index) => {
      if (curSorter.order && typeof curSorter.field === "string") {
        sortedData = sortedData.sort((a, b) => {
          const order = curSorter.order === "ascend" ? "asc" : "desc";
          return enhancedCompare(a, b, order, curSorter.field as string);
        });
      } else {
      }
    });
    return sortedData;
  };
  const filterDataByRegExp = (data: FileInfoCustom[]) => {
    if (!searchReg) {
      return data;
    }
    const filtered = data.filter((item) => searchReg.test(item.name));
    return filtered;
  };

  // 根据过滤类型和排序配置更新展示数据
  useEffect(() => {
    const filteredData = filterDataByFileType(originalData, filterType);
    const sortedData = sortData(filteredData, sortConfig);
    const Result = filterDataByRegExp(sortedData);
    setShowData(Result);
  }, [searchReg, originalData, filterType, sortConfig, searchReg]);
  const onContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    record?: FileInfoCustom,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (contextContainerRef.current) {
      const rect = contextContainerRef.current.getBoundingClientRect();
      const x = e.clientX - window.scrollX - rect.left;
      const y = e.clientY - window.scrollY - rect.top;
      showMenu({
        x,
        y,
      });
    }
    if (record) {
      setCurrentRow(record);
    }
  };
  const onRowClick = (
    event: React.MouseEvent<HTMLDivElement>,
    record: FileInfoCustom,
  ) => {
    if (previewFile?.filePath === record.filePath) {
      return;
    }
    if (previewFile) {
      previewFile.isSelected = false;
    }
    record.isSelected = true;
    if (record.type === "Folder") {
      setPreviewFile(null);
    } else {
      setPreviewFile(record);
    }
    setCurrentRow(record);
  };
  const onDoubleClick = (
    event: React.MouseEvent<HTMLDivElement>,
    record: FileInfoCustom,
  ) => {
    setCurrentRow(record);
    ipcRendererInvoke("open-file", record.filePath);
  };
  /**
   * 表格数据变更处理函数。
   * 该函数用于处理表格的分页、筛选和排序变化。根据这些变化，对数据进行相应的处理并更新表格展示的数据。
   * @param pagination 分页信息，包含当前页码和每页的记录数等。
   * @param filters 筛选条件，用于过滤数据。
   * @param sorter 排序条件，用于对数据进行排序。
   */

  const tableChange: TableChangeType = (pagination, filters, sorter) => {
    handleTableSortChange(sorter);
  };
  const currentViewComponent = () => {
    switch (currentView) {
      case "small-icon":
        return (
          <IconView
            key="small-icon"
            className="file-manage-content__left icon-view__small"
            files={showData}
          />
        );
      case "medium-icon":
        return (
          <IconView
            key="medium-icon"
            className="file-manage-content__left icon-view__medium"
            files={showData}
          />
        );
      case "large-icon":
        return (
          <IconView
            key="large-icon"
            className="file-manage-content__left icon-view__large"
            files={showData}
          />
        );
      case "detail":
      default:
        return (
          <TableView
            className="file-manage-content__left"
            files={showData}
            getColumns={getTableColunm}
          />
        );
    }
  };
  const execSearch = async () => {
    if (!directoryPath) {
      return;
    }
    setIsShowLoading(true);
    try {
      const result: FileInfoWithStats[] = await ipcRendererInvoke(
        "get-dir-and-file-info",
        directoryPath,
        isUseIgnoredFiles,
      );
      const customResult: FileInfoCustom[] = result.map((item) => {
        return {
          ...item,
          key: item.filePath,
          isSelected: false,
        };
      });
      setOriginalData(customResult);
    } catch (error) {
    } finally {
      setIsShowLoading(false);
    }
  };
  useEffect(() => {
    execSearch();
  }, [directoryPath]);
  return (
    <FileManageContext.Provider
      value={{
        tableChange,
        currentRow,
        showData,
        onRowClick,
        onContextMenu,
        onDoubleClick,
        isUsePreview,
        setCurrentView,
        setIsUsePreview,
        hideMenu,
        sortConfig,
        setSortConfig,
        lockOrder,
        setLockOrder,
      }}
    >
      <Layout className="file-manage-layout">
        {isShowLoading && <Loading />}
        <div className="file-manage-path">
          <span className="file-manage-path__result">
            当前路径：{directoryPath}
          </span>
          <Checkbox
            className="file-manage-path__checkbox"
            checked={isUseIgnoredFiles}
            onChange={(e) => setUseIgnoredFiles(e.target.checked)}
          >
            使用忽略文件
          </Checkbox>
        </div>
        <Header className="file-manage-header">
          <RegExpInput
            className="file-manage-header__search"
            setRegExp={debounce(setSearchReg, 300)}
            placeholder="输入搜索内容"
            size="small"
          />
          <Select
            size="small"
            className="file-manage-header__select"
            style={{
              width: 120,
              marginLeft: 8,
            }}
            defaultValue="All"
            onChange={setFilterType}
          >
            {options.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Header>
        <Content
          ref={contextContainerRef}
          onContextMenu={onContextMenu}
          className="file-manage-content"
        >
          <ContextMenu
            getMenus={getMenus}
            isMenuVisible={isMenuVisible}
            menuPosition={menuPosition}
            onRequestClose={hideMenu}
          />
          {currentViewComponent()}
          {isUsePreview && (
            <Preview
              previewFile={previewFile}
              className="file-manage-content__right"
            />
          )}
        </Content>
        <Footer className="file-manage-footer">
          {/* 显示文件搜索结果 */}
          <span className="file-manage-footer__result">
            搜索结果：{showData.length}
          </span>
        </Footer>
      </Layout>
    </FileManageContext.Provider>
  );
};
export default FileManage;
