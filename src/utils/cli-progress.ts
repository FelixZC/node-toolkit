// 导入用于创建命令行进度条的库 cli-progress
import * as cliProgress from 'cli-progress'

// 定义一个名为 useCliProgress 的函数，接受一个可选参数 total（默认值为 0），表示要完成的任务总数
export const useCliProgress = (total: number = 0) => {
  // 初始化计数器 count 为 0，用于跟踪已完成任务的数量
  let count = 0

  // 创建一个新的 SingleBar 实例，这是 cli-progress 库中的一个单线程进度条对象
  // 使用 shades_classic 预设样式
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

  /**
   * 定义内部函数 updateBar，用于更新进度条状态：
   *  - 增加计数器 count
   *  - 调用 bar1.update 更新进度条显示
   *  - 如果 count 达到或超过 total，则停止进度条并重置 count 为 0
   */
  const updateBar = () => {
    count++
    bar1.update(count)

    if (count >= total) {
      bar1.stop()
      count = 0
    }
  }

  // 如果传入的 total 大于 0，启动进度条，设置总任务数为 total，当前完成数为 count
  if (total > 0) {
    bar1.start(total, count)
  }

  // 返回一个对象，包含 updateBar 函数，供外部调用以更新进度
  return {
    updateBar
  }
}
