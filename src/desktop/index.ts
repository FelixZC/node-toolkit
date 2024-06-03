import { app, Event as ElectronEvent, WebContents, Certificate } from 'electron'
import { createMainWindow } from './mainWindow'
import { initTray, getTray } from './systemTray'

app.on('ready', () => {
  createMainWindow()
  initTray()
})

// 正确处理 'certificate-error' 事件
app.on(
  'certificate-error',
  (
    event: ElectronEvent,
    webContents: WebContents,
    url: string,
    error: string,
    certificate: Certificate,
    callback: (trust: boolean) => void
  ) => {
    event.preventDefault() // 阻止默认行为
    // 总是信任证书，仅为示例，实际生产中需谨慎处理
    callback(true)
  }
)

app.on('before-quit', () => {
  console.log('app before-quit')
})

app.on('window-all-closed', () => {
  console.log('window-all-closed')
})

app.on('activate', () => {
  console.log('activate')
})

app.on('quit', () => {
  console.log('quit')
  if (getTray()) {
    getTray()!.destroy()
  }
})

app.on('will-quit', () => {
  console.log('will-quit')
})

app.on('will-finish-launching', () => {
  console.log('will-finish-launching')
})