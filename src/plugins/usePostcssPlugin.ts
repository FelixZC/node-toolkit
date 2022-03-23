import postcss from 'postcss'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { ExecFileInfo } from './common'
const syntax = require('postcss-syntax')({
  rules: [
    {
      test: /\.(?:[sx]?html?|[sx]ht|vue|ux|php)$/i,
      extract: 'html'
    },
    {
      test: /\.(?:markdown|md)$/i,
      extract: 'markdown'
    },
    {
      test: /\.(?:[cm]?[jt]sx?|es\d*|pac)$/i,
      extract: 'jsx'
    },
    {
      // custom language for file extension
      test: /\.postcss$/i,
      lang: 'scss'
    }
  ],
  // custom parser for CSS (using `postcss-safe-parser`)
  css: 'postcss-safe-parser',
  // custom parser for SASS (PostCSS-compatible syntax.)
  sass: require('postcss-sass'),
  // custom parser for SCSS (by module name)
  scss: 'postcss-scss',
  // custom parser for LESS (by module path)
  less: './node_modules/postcss-less',
  // custom parser for SugarSS
  sugarss: require('sugarss')
})
const runPostcssPlugin = async (execFileInfo: ExecFileInfo, plugins: PostcssPlugin[] = []) => {
  const result = await postcss(plugins).process(execFileInfo.source, {
    from: execFileInfo.path,
    syntax: syntax
  })
  return result.css
}

export default runPostcssPlugin
