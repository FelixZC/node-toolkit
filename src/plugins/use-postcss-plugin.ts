import postcss from 'postcss'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { ExecFileInfo } from './common'
import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'

const syntax = require('postcss-syntax')({
  rules: [
    {
      test: /\.(?:[sx]?html?|[sx]ht|ux|php)$/i,
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

const getSyntax = (stypeType: string | undefined) => {
  switch (stypeType) {
    case 'sass':
      return require('postcss-sass')

    case 'scss':
      return require('postcss-scss')

    case 'less':
      return require('postcss-less')

    case 'unknown':
      return undefined

    default:
      return syntax
  }
}

const transform = async (
  execFileInfo: ExecFileInfo,
  pluginsList: PostcssPlugin[],
  styleType?: string
) => {
  const result = await postcss(pluginsList).process(execFileInfo.source, {
    from: execFileInfo.path,
    syntax: getSyntax(styleType)
  })
  return result.css
}

const runPostcssPlugin = async (execFileInfo: ExecFileInfo, pluginsList: PostcssPlugin[] = []) => {
  if (!pluginsList.length) {
    return execFileInfo.source
  }

  if (!execFileInfo.path.endsWith('.vue')) {
    return transform(execFileInfo, pluginsList)
  }

  const { descriptor } = parseSFC(execFileInfo.source, {
    filename: execFileInfo.path
  })
  const styles = descriptor.styles

  if (styles.length) {
    for (const style of styles) {
      execFileInfo.source = style.content
      const out = await transform(execFileInfo, pluginsList, style.lang || 'unknown')
      style.content = out
    }
  }

  return stringifySFC(descriptor)
}

export default runPostcssPlugin
