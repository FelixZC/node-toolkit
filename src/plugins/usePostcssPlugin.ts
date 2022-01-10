import type { ExecFileInfo } from './common'
import postcss from 'postcss'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'

const getPostcssPluginActuator = async (
  execFileInfo: ExecFileInfo,
  plugins: PostcssPlugin[] = []
) => {
  const result = await postcss(plugins).process(execFileInfo.source, {})
  return result.css
}

export default getPostcssPluginActuator
