import { Progress } from 'antd'
import React from 'react'
import useProgress from '@src/store/use-progress'
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
