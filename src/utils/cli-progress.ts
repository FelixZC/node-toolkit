import * as cliProgress from "cli-progress";
export const createCliProgress = (total: number = 0) => {
  let count = 0;
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  const updateBar = () => {
    count++;
    bar.update(count);
    if (count >= total) {
      bar.stop();
      count = 0;
    }
  };
  if (total > 0) {
    bar.start(total, count);
  }
  return {
    updateBar,
  };
};
