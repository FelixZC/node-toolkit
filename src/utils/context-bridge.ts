import { contextBridge, ipcRenderer } from 'electron'
type ExposedInMainWorld = {
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, func: (event: any, ...args: any[]) => void) => void
  once: (channel: string, func: (event: any, ...args: any[]) => void) => void
  removeListener: (channel: string, func: (event: any, ...args: any[]) => void) => void
  sendSync: (channel: string, ...args: any[]) => any
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

/**
 * contextBridge.exposeInMainWorld的作用就是将主进程的某些API注入到渲染进程，
 * 供渲染进程使用（主进程并非所有的API或对象都能注入给渲染进程，需要参考文档）
 * ipcRenderer 渲染进程通过window.ipcRenderer调用
 */
const exposedIpcRenderer: ExposedInMainWorld = {
  send: (channel: string, ...args: any[]) => {
    if (args.length > 0) {
      ipcRenderer.send(channel, ...args)
    } else {
      ipcRenderer.send(channel)
    }
  },
  on: (channel: string, func: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, func)
  },
  once: (channel: string, func: (event: any, ...args: any[]) => void) => {
    ipcRenderer.once(channel, func)
  },
  removeListener: (channel: string, func: (event: any, ...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, func)
  },
  sendSync: (channel: string, ...args: any[]) => {
    if (args.length > 0) {
      return ipcRenderer.sendSync(channel, ...args)
    } else {
      return ipcRenderer.sendSync(channel)
    }
  },
  invoke: (channel: string, ...args: any[]): Promise<any> => {
    return ipcRenderer.invoke(channel, ...args).catch((error) => {
      console.error(`Error invoking API: ${channel}`, error)
      throw error // 重新抛出错误，以便调用者可以处理
    })
  }
}
contextBridge.exposeInMainWorld('ipcRenderer', exposedIpcRenderer)

// 将 process 作为对象暴露，而非直接修改全局 process 对象
contextBridge.exposeInMainWorld('process', {
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development' // 默认为 development，如果 NODE_ENV 未定义
  }
})
