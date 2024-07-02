/**
 * 主窗口模块，负责创建和管理应用程序的主要窗口。
 * 使用Electron框架，配置窗口属性，并处理窗口事件。
 */
import { BrowserWindow } from "electron";
import { createMenu } from "./menus";
import { initTray } from "./system-tray";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from "electron-devtools-installer";
import mainWindowHandleEvents from "./handle";
import mainWindowListenEvents from "./listen";
import * as path from "path";
type DevelopmentOrProduction = "development" | "production";
const isDevelopment: DevelopmentOrProduction = process.env
  .NODE_ENV! as DevelopmentOrProduction;
let mainWindow: BrowserWindow | null = null; // 全局变量，用于存储主窗口对象

/**
 * 创建并配置主窗口。
 * 根据环境加载不同的资源，并设置窗口属性。
 */
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1160,
    height: 752,
    minHeight: 632,
    minWidth: 960,
    show: false,
    // frame: false,
    title: "node tookit",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.resolve(__dirname, "../utils/context-bridge.js"),
    },
    icon: path.resolve(__dirname, "../../../build/electron-logo1.ico"),
  });
  if (isDevelopment === "development") {
    mainWindow.loadURL("http://localhost:8848/home");
  } else {
    const entryPath = path.join(__dirname, "../../../build/index.html");
    mainWindow.loadFile(entryPath);
  }
  mainWindow.once("ready-to-show", async () => {
    initTray();
    createMenu(mainWindow!);
    mainWindow!.show();

    // 安装 React Developer Tools 和 Redux DevTools 扩展，并行处理,
    const installPromises = [
      installExtension(REACT_DEVELOPER_TOOLS),
      installExtension(REDUX_DEVTOOLS),
    ];
    try {
      // 等待所有扩展安装完成,访问不了谷歌商城就不用等了,注释掉或者离线下载
      await Promise.all(installPromises);
    } catch (err) {}
  });
  mainWindowListenEvents(mainWindow);
  mainWindowHandleEvents();
}

/**
 * 检查主窗口是否存在且未被销毁。
 * @returns {boolean} 如果主窗口存在且未被销毁，则返回true；否则返回false。
 */
function mainWindowIsExist(): boolean {
  return mainWindow !== null && !mainWindow.isDestroyed();
}

/**
 * 获取主窗口对象。
 * @returns {BrowserWindow | null} 返回主窗口对象，如果主窗口不存在则返回null。
 */
function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
export { createMainWindow, getMainWindow, mainWindowIsExist };
