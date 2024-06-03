import * as cliProgress from 'cli-progress'

// 定义一个名为 useCliProgress 的函数，接受一个可选参数 total（默认值为 0），表示要完成的任务总数
export const useCliProgress = (total: number = 0) => {
  let count = 0
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  const updateBar = () => {
    count++
    bar1.update(count)

    if (count >= total) {
      bar1.stop()
      count = 0
    }
  }

  if (total > 0) {
    bar1.start(total, count)
  }

  return {
    updateBar
  }
}
