import { createSlice, PayloadAction } from '@reduxjs/toolkit'
interface ProgressState {
  value: number
  isVisible: boolean
  isReset: boolean
}
const initialState: ProgressState = {
  value: 0,
  isVisible: false,
  isReset: false
}
export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    updateProgress: (state, action: PayloadAction<number>) => {
      state.value = action.payload
      state.isVisible = true
      state.isReset = false
    },
    toggleVisibility: (state) => {
      state.isVisible = !state.isVisible
    },
    resetProgress: (state) => {
      state.value = 0
      state.isVisible = false
      state.isReset = true
    }
  }
})
export default progressSlice.reducer
