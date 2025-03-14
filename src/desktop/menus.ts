import { clearCacheAll } from "../utils/fs";
import { dialog, Menu, MenuItemConstructorOptions, shell } from "electron";
import { getIgnorePath } from "../utils/ignore";
import { Logger } from "../utils/log";
import fs from "fs-extra";
const getMenuTemplate = (
  mainWindow: Electron.BrowserWindow,
): Array<MenuItemConstructorOptions> => {
  const menuTemplate: Array<MenuItemConstructorOptions> = [
    {
      label: "File",
      submenu: [
        {
          label: "Open Folder",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ["openDirectory"], // 设定为只选择目录
            });
            if (result.filePaths.length > 0) {
              mainWindow.webContents.send(
                "open-directory",
                result.filePaths[0],
              );
            }
          },
        },
        {
          label: "Open Operate Log",
          accelerator: "CmdOrCtrl+L",
          click: () => {
            const logPath = Logger.getLogPath();
            if (!fs.existsSync(logPath)) {
              fs.ensureFileSync(logPath);
            }
            try {
              shell.openPath(logPath);
            } catch (error) {
              dialog.showMessageBox({
                type: "error",
                message: "Error opening file",
                buttons: ["OK"],
              });
            }
          },
        },
        {
          label: "Open Ignore Setting",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            const ignorePath = getIgnorePath();
            try {
              shell.openPath(ignorePath);
            } catch (error) {
              Logger.getInstance().error(error);
              dialog.showMessageBox({
                type: "error",
                message: "Error opening ignore setting",
                buttons: ["OK"],
              });
            }
          },
        },
        {
          label: "Clear Files Cache",
          accelerator: "CmdOrCtrl+F5",
          click: () => {
            clearCacheAll();
            dialog.showMessageBox({
              type: "info",
              message: "Alreadly clear cache all",
              buttons: ["OK"],
            });
          },
        },
        {
          role: "quit",
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        {
          role: "undo",
        },
        {
          role: "redo",
        },
        {
          type: "separator",
        },
        {
          role: "cut",
        },
        {
          role: "copy",
        },
        {
          role: "paste",
        },
        {
          role: "delete",
        },
        {
          type: "separator",
        },
        {
          role: "selectAll",
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          role: "reload",
        },
        {
          role: "forceReload",
        },
        {
          role: "toggleDevTools",
        },
        {
          type: "separator",
        },
        {
          role: "resetZoom",
        },
        {
          role: "zoomIn",
        },
        {
          role: "zoomOut",
        },
        {
          type: "separator",
        },
        {
          role: "togglefullscreen",
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        {
          role: "minimize",
        },
        {
          role: "zoom",
        },
        {
          role: "close",
        },
        {
          type: "separator",
        },
        {
          role: "front",
        },
      ],
    },
  ];
  return menuTemplate;
};
export const createMenu = (mainWindow: Electron.BrowserWindow) => {
  const menuTemplate = getMenuTemplate(mainWindow);
  const applicationMenu = Menu.buildFromTemplate(menuTemplate);
  // 根据平台设置菜单
  if (process.platform === "darwin") {
    Menu.setApplicationMenu(applicationMenu); // macOS上设置应用菜单
  } else {
    mainWindow.setMenu(applicationMenu); // 其他平台上设置窗口菜单
  }
};
