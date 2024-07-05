import { BrowserWindow, ipcMain } from "electron";
import { mainWindowIsExist } from "./main-window";

/**
 * 监听主窗口的事件，包括最小化、最大化、恢复、关闭和打开开发者工具。
 */
export default function mainWindowListenEvents(
  mainWindow: BrowserWindow,
): void {
  ipcMain.on("mainWindow-min", () => {
    if (mainWindowIsExist()) {
      mainWindow!.minimize();
    }
  });
  ipcMain.on("mainWindow-max", () => {
    if (mainWindowIsExist()) {
      mainWindow!.maximize();
      mainWindow!.webContents.send("mainWindowIsMax", true);
    }
  });
  ipcMain.on("mainWindow-restore", () => {
    if (mainWindowIsExist()) {
      mainWindow!.unmaximize();
      mainWindow!.webContents.send("mainWindowIsMax", false);
    }
  });
  ipcMain.on("mainWindow-close", () => {
    if (mainWindowIsExist()) {
      mainWindow!.close();
    }
  });
  ipcMain.on("mainWindow-open-devtool", () => {
    if (mainWindowIsExist()) {
      mainWindow!.webContents.openDevTools();
    }
  });
}
