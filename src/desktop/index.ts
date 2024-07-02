import {
  app,
  Certificate,
  Event as ElectronEvent,
  WebContents,
} from "electron";
import { createMainWindow } from "./main-window";
import { getTray } from "./system-tray";
app.on("ready", () => {
  createMainWindow();
});
app.on(
  "certificate-error",
  (
    event: ElectronEvent,
    webContents: WebContents,
    url: string,
    error: string,
    certificate: Certificate,
    callback: (trust: boolean) => void,
  ) => {
    event.preventDefault(); // 阻止默认行为
    // 总是信任证书，仅为示例，实际生产中需谨慎处理
    callback(true);
  },
);
app.on("before-quit", () => {});
app.on("window-all-closed", () => {
  app.quit();
});
app.on("activate", () => {});
app.on("quit", () => {
  if (getTray()) {
    getTray()!.destroy();
  }
});
app.on("will-quit", () => {});
app.on("will-finish-launching", () => {});
