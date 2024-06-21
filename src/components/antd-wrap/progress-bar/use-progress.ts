import { useState, useCallback } from 'react'
import type { ProgressProps } from './index'
const useProgress = () => {
  const [state, setState] = useState<ProgressProps>({
    value: 0,
    isVisible: false,
    isReset: false
  })

  const updateProgress = useCallback((newValue: number) => {
    setState((prevState) => ({
      ...prevState,
      value: newValue,
      isVisible: true,
      isReset: false
    }))
  }, [])

  const toggleVisibility = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isVisible: !prevState.isVisible
    }))
  }, [])

  const resetProgress = useCallback(() => {
    setState({
      value: 0,
      isVisible: false,
      isReset: true
    })
  }, [])

  return {
    value: state.value,
    isVisible: state.isVisible,
    isReset: state.isReset,
    updateProgress,
    toggleVisibility,
    resetProgress
  }
}

export default useProgress
