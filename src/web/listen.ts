import store from '@src/store'
import { ipcRendererOn } from '@src/utils/desktop-utils'
import { directorySlice } from '@src/slices/directory-slice'
export default function openRendererListenEvents() {
  // ipcRendererOn('main-window-ready', () => {
  //   console.log('main-window-ready')
  // })

  // ipcRendererOn('main-window-close', () => {
  //   console.log('main-window-close')
  // })

  ipcRendererOn('open-directory', (event, selectedPath: string) => {
    console.log('open-directory', selectedPath)
    store.dispatch(directorySlice.actions.setDirectoryPath(selectedPath))
  })
}
