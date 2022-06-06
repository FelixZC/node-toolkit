import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'
import postcss from 'postcss'
import type { ExecFileInfo } from './common'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'

const syntax = require('postcss-syntax')({
  // custom parser for CSS (using `postcss-safe-parser`)
  css: 'postcss-safe-parser',
  // custom parser for LESS (by module path)
  less: './node_modules/postcss-less',
  rules: [
    {
      extract: 'html',
      test: /\.(?:[sx]?html?|[sx]ht|ux|php)$/i
    },
    {
      extract: 'markdown',
      test: /\.(?:markdown|md)$/i
    },
    {
      extract: 'jsx',
      test: /\.(?:[cm]?[jt]sx?|es\d*|pac)$/i
    },
    {
      lang: 'scss',
      // custom language for file extension
      test: /\.postcss$/i
    }
  ],
  // custom parser for SASS (PostCSS-compatible syntax.)
  sass: require('postcss-sass'),
  // custom parser for SCSS (by module name)
  scss: 'postcss-scss',
  // custom parser for SugarSS
  sugarss: require('sugarss')
})

const getSyntax = (stypeType: string | undefined) => {
  switch (stypeType) {
    case 'less':
      return require('postcss-less')

    case 'sass':
      return require('postcss-sass')

    case 'scss':
      return require('postcss-scss')

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
