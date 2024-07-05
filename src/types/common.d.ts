import type { IpcRendererEvent } from "electron";

/**
 * 扩展了Window接口，添加了ipcRenderer和process属性。
 * ipcRenderer用于与电子应用程序的主进程进行通信。
 * process包含了环境变量信息，如NODE_ENV。
 */
declare global {
  interface Window {
    ipcRenderer: {
      send: (...args: any[]) => void; // 发送异步消息到主进程
      on: (
        channel: string,
        listener: (event: IpcRendererEvent, ...args: any[]) => void,
      ) => void; // 监听ipcRenderer事件
      once: (
        channel: string,
        listener: (event: IpcRendererEvent, ...args: any[]) => void,
      ) => void; // 监听一次ipcRenderer事件
      removeListener: (
        channel: string,
        listener: (event: IpcRendererEvent, ...args: any[]) => void,
      ) => void; // 移除ipcRenderer事件监听器
      sendSync: (...args: any[]) => any; // 发送同步消息到主进程
      invoke: (...args: any[]) => Promise<any>; // 发送异步消息到主进程并等待回应
    };
    process: {
      NODE_ENV: "development" | "production"; // 应用的环境，'development' 或 'production'
    };
  }
}

/**
 * 定义 ExecFileInfo 接口
 * 用于描述执行文件的信息
 *
 * @property {string} source 表示文件的源代码
 * @property {string} path 表示文件的路径
 * @property {Record<string, any>?} extra 可选的额外信息，以键值对的形式存储
 */
export interface ExecFileInfo {
  source: string;
  path: string;
  extra?: Record<string, any>;
}
