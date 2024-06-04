// progressSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { useSelector, useDispatch } from 'react-redux'

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

const progressSlice = createSlice({
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

// 自定义 Hooks
export const useProgress = () => {
  const dispatch = useDispatch()
  const { value, isVisible, isReset } = useSelector<{ progress: ProgressState }, ProgressState>(
    (state) => state.progress
  )

  const updateProgress = (newValue: number) => {
    dispatch(progressSlice.actions.updateProgress(newValue))
  }

  const toggleVisibility = () => {
    dispatch(progressSlice.actions.toggleVisibility())
  }

  const resetProgress = () => {
    dispatch(progressSlice.actions.resetProgress())
  }

  return {
    value,
    isVisible,
    isReset,
    updateProgress,
    toggleVisibility,
    resetProgress
  }
}
