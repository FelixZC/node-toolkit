import * as cliProgress from 'cli-progress'
export const useCliProgress = (total: number = 0) => {
  let count = 0 // if (!total) {
  //   throw new Error('cli-progress缺少总数')
  // }

  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  bar1.start(total, count)

  const updateBar = () => {
    count++
    bar1.update(count)

    if (count >= total) {
      bar1.stop()
      count = 0
    }
  }

  return {
    updateBar
  }
}
