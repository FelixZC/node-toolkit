import React, { useState, useCallback } from 'react'
import { Progress } from 'antd'

// 定义一个名为 useProgress 的自定义钩子，它接受一个可选参数 total（默认值为 100），表示要完成的任务总数
const useProgress = (total: number = 100) => {
  // 定义进度状态，初始值为0
  const [progress, setProgress] = useState(0)

  // 定义一个更新进度的函数
  const updateProgress = useCallback(() => {
    // 增加进度
    setProgress((prevProgress) => {
      if (prevProgress >= total) {
        // 如果进度超过总数，则重置为0
        return 0
      }
      // 否则增加1%
      return Math.min(prevProgress + 1, total)
    })
  }, [total])

  return {
    progress, // 当前进度值
    updateProgress, // 更新进度的函数
    setProgress // 设置进度的函数，可能用于外部控制进度
  }
}

// 使用 useProgress 钩子的函数组件示例
const ProgressComponent: React.FC = () => {
  const { progress, updateProgress } = useProgress(200) // 假设总进度为200

  return (
    <div>
      <Progress percent={progress} />
      <button onClick={updateProgress}>更新进度</button>
    </div>
  )
}

export default ProgressComponent
