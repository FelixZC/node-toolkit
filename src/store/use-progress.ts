import { progressSlice } from '@src/slices/progress-slice'
import { RootState } from '@src/store'
import { useDispatch, useSelector } from 'react-redux'
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
