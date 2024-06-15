import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@src/store'
import { progressSlice } from '@src/slices/progress-slice'

const useProgress = () => {
  const dispatch = useDispatch()
  const { value, isVisible, isReset } = useSelector((state: RootState) => state.progress)
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
export default useProgress
