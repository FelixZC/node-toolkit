import * as cliProgress from "cli-progress";
export const useCliProgress = (total: number = 0) => {
  let count = 0;
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  const updateBar = () => {
    count++;
    bar1.update(count);
    if (count >= total) {
      bar1.stop();
      count = 0;
    }
  };
  if (total > 0) {
    bar1.start(total, count);
  }
  return {
    updateBar,
  };
};
