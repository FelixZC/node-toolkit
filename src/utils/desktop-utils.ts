import type { IpcRendererEvent } from 'electron'

/**
 * 扩展了Window接口，添加了ipcRenderer和process属性。
 * ipcRenderer用于与电子应用程序的主进程进行通信。
 * process包含了环境变量信息，如NODE_ENV。
 */
declare global {
  interface Window {
    ipcRenderer: {
      send: (...args: any[]) => void // 发送异步消息到主进程
      on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void // 监听ipcRenderer事件
      once: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void // 监听一次ipcRenderer事件
      removeListener: (
        channel: string,
        listener: (event: IpcRendererEvent, ...args: any[]) => void
      ) => void // 移除ipcRenderer事件监听器
      sendSync: (...args: any[]) => any // 发送同步消息到主进程
      invoke: (...args: any[]) => Promise<any> // 发送异步消息到主进程并等待回应
    }
    process: {
      NODE_ENV: 'development' | 'production' // 应用的环境，'development' 或 'production'
    }
  }
}

/**
 * 检查当前环境是否为桌面应用。
 * @returns {boolean} 如果当前环境支持ipcRenderer则返回true，否则返回false。
 */
export const isDesktop = () => {
  return !!window.ipcRenderer
}

/**
 * 获取当前进程的环境变量。
 * @returns {string | undefined} 返回process的NODE_ENV值，可能为'development'、'production'或undefined。
 */
export const getProcessNodeEnv = () => {
  return window?.process?.NODE_ENV
}

/**
 * 向主进程发送异步消息。
 * @param {string} eventName - 事件名称。
 * @param {...any[]} args - 传递给事件的参数。
 */
export const ipcRendererSend = (eventName: string, ...args: any[]) => {
  window.ipcRenderer?.send(eventName, ...args)
}

/**
 * 向主进程发送同步消息。
 * @param {string} eventName - 事件名称。
 * @param {...any[]} args - 传递给事件的参数。
 * @returns 返回主进程发送回的消息。
 */
export const ipcRendererSendSync = (eventName: string, ...args: any[]) => {
  return window.ipcRenderer?.sendSync(eventName, ...args)
}

/**
 * 向主进程发送异步消息并等待回应。
 * @param {string} eventName - 事件名称。
 * @param {...any[]} args - 传递给事件的参数。
 * @returns 返回主进程的回应数据，若发生错误则返回null。
 */
export const ipcRendererInvoke = (eventName: string, ...args: any[]) => {
  try {
    return window.ipcRenderer?.invoke(eventName, ...args)
  } catch (error) {
    console.error(`Error invoking IPC: ${eventName}`, error)
    return null
  }
}

/**
 * 注册一个监听器，当事件发生时调用。
 * @param {string} eventName - 事件名称。
 * @param {(...args: any[]) => void} listener - 事件触发时执行的回调函数。
 */
export const ipcRendererOn = (
  eventName: string,
  listener: (event: IpcRendererEvent, ...args: any[]) => void
) => {
  window.ipcRenderer?.on(eventName, listener)
}

/**
 * 注册一个只触发一次的监听器。
 * @param {string} eventName - 事件名称。
 * @param {(...args: any[]) => void} listener - 事件触发时执行的回调函数。
 */
export const ipcRendererOnce = (
  eventName: string,
  listener: (event: IpcRendererEvent, ...args: any[]) => void
) => {
  window.ipcRenderer?.once(eventName, listener)
}

/**
 * 移除指定事件的监听器。
 * @param {string} eventName - 事件名称。
 * @param {(...args: any[]) => void} listener - 需要移除的回调函数。
 */
export const ipcRendererRemoveListener = (
  eventName: string,
  listener: (...args: any[]) => void
) => {
  window.ipcRenderer?.removeListener(eventName, listener)
}
