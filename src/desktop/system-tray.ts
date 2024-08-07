import { app, Menu, Tray } from "electron";
import { getMainWindow, mainWindowIsExist } from "./main-window";
import * as path from "path";
let tray: Tray | null = null;
/*
 * 定义Tray图标的路径
 */
const iconPath: string = path.resolve(
  __dirname,
  "../../../build/electron-logo1.png",
);

/*
 * 初始化Tray菜单
 */
function initTray(): void {
  // 创建Tray实例
  tray = new Tray(iconPath);

  // 构建上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "打开应用",
      click: (): void => {
        // 如果主窗口存在，则显示主窗口
        if (mainWindowIsExist()) {
          getMainWindow()!.show();
        }
      },
    },
    {
      label: "退出应用",
      click: (): void => {
        // 点击退出应用菜单项时，退出应用
        app.quit();
      },
    },
  ]);

  // 设置Tray的提示文字和上下文菜单
  tray.setToolTip("node tookit");
  tray.setContextMenu(contextMenu);

  // 绑定Tray点击事件，如果主窗口存在，则显示主窗口
  tray.on("click", () => {
    if (mainWindowIsExist()) {
      getMainWindow()!.show();
    }
  });
}

/*
 * 获取Tray实例
 * @returns {Tray} 返回当前的Tray实例
 */
function getTray(): Tray | null {
  return tray;
}

/*
 * 模块导出
 */
export { initTray, getTray };
