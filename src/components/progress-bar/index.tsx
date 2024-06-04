import React from 'react'
import { Progress } from 'antd'
import { useProgress } from '@src/slices/progress-slice'

const ProgressBar = () => {
  const { value, isVisible, isReset } = useProgress()
  return (
    <div>
      {isVisible && (
        <Progress percent={value} strokeWidth={18} status={isReset ? 'active' : 'success'} />
      )}
    </div>
  )
}

export default ProgressBar
