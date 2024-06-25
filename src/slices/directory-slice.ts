import { createSlice, PayloadAction } from '@reduxjs/toolkit'
export interface DirectoryState {
  directoryPath: string
  isUseIgnoredFiles: boolean
}
const initialState: DirectoryState = {
  directoryPath: '',
  isUseIgnoredFiles: true
}
export const directorySlice = createSlice({
  name: 'directory',
  initialState,
  reducers: {
    setDirectoryPath: (state, action: PayloadAction<string>) => {
      state.directoryPath = action.payload
    },
    setUseIgnoredFiles: (state, action: PayloadAction<boolean>) => {
      state.isUseIgnoredFiles = action.payload
    }
  }
})
export default directorySlice.reducer
