import postcss from 'postcss'
import type { ExecFileInfo } from './common'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'

const runPostcssPlugin = async (execFileInfo: ExecFileInfo, plugins: PostcssPlugin[] = []) => {
  const result = await postcss(plugins).process(execFileInfo.source, {})
  return result.css
}

export default runPostcssPlugin
