import { directorySlice } from '@src/slices/directory-slice'
import { ipcRendererOn } from '@src/utils/desktop-utils'
import store from '@src/store'
export default function openRendererListenEvents() {
  // ipcRendererOn('main-window-ready', () => {
  //   console.log('main-window-ready')
  // })

  // ipcRendererOn('main-window-close', () => {
  //   console.log('main-window-close')
  // })

  ipcRendererOn('open-directory', (event, selectedPath: string) => {
    store.dispatch(directorySlice.actions.setDirectoryPath(selectedPath))
  })
}
