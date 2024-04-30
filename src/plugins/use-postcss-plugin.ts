import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'
import postcss from 'postcss'
import type { ExecFileInfo } from './common'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
// 导入 `postcss-syntax` 模块并配置自定义解析器
const syntax = require('postcss-syntax')({
  // 使用 `postcss-safe-parser` 作为 CSS 的自定义解析器
  css: 'postcss-safe-parser',
  // 通过模块路径指定 LESS 的自定义解析器
  less: './node_modules/postcss-less',
  // 定义解析规则数组
  rules: [
    {
      // 提取 HTML 语法
      extract: 'html',
      // 匹配 HTML、SHTML、XHTML、PHP 等文件扩展名
      test: /\.(?:[sx]?html?|[sx]ht|ux|php)$/i
    },
    {
      // 提取 Markdown 语法
      extract: 'markdown',
      // 匹配 Markdown 文件扩展名
      test: /\.(?:markdown|md)$/i
    },
    {
      // 提取 JSX 语法
      extract: 'jsx',
      // 匹配 JSX、TSX、ES、PAC 等文件扩展名
      test: /\.(?:[cm]?[jt]sx?|es\d*|pac)$/i
    },
    {
      // 指定 SCSS 为自定义语言并匹配 .postcss 文件扩展名
      lang: 'scss',
      test: /\.postcss$/i
    }
  ],
  // 使用 `postcss-sass` 作为 SASS 的自定义解析器
  sass: require('postcss-sass'),
  // 使用 `postcss-scss` 作为 SCSS 的自定义解析器
  scss: 'postcss-scss',
  // 使用 `sugarss` 作为 SugarSS 的自定义解析器
  sugarss: require('sugarss')
})

/**
 * 根据给定的类型获取对应的解析器。
 *
 * @param stypeType - 解析器类型（如 'less', 'sass', 'scss' 或 'unknown'）
 * @returns 返回指定类型的解析器模块，若类型未知则返回默认解析器。
 */
const getSyntax = (stypeType: string | undefined) => {
  switch (stypeType) {
    // 根据类型动态导入并返回对应的解析器
    case 'less':
      return require('postcss-less')

    case 'sass':
      return require('postcss-sass')

    case 'scss':
      return require('postcss-scss')

    // 如果类型为 'unknown'，返回 undefined
    case 'unknown':
      return undefined

    // 默认返回预配置的通用解析器
    default:
      return syntax
  }
}
/**
 * 主要用于处理和转换 CSS/LESS/SASS/SCSS/JSX 等样式的工具函数。
 * 可以根据不同的文件类型，使用不同的解析器（syntax）来处理样式文件，
 * 并通过 PostCSS 插件列表对样式进行转换和处理。
 *
 * @param execFileInfo - 包含文件执行信息的对象，必须包含 source（源代码）和 path（文件路径）。
 * @param pluginsList - PostCSS 插件数组，用于对样式进行处理。
 * @param styleType - 可选参数，指定样式文件的类型（如 'less', 'sass', 'scss'），以便使用对应的解析器。
 * @returns 返回处理后的样式字符串。
 */
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

/**
 * 运行 PostCSS 插件。
 * 此函数首先会判断是否传入了插件列表，若没有则直接返回源代码；
 * 若有插件列表但处理的不是 .vue 文件，则调用 `transform` 函数进行样式转换；
 * 若是 .vue 文件，则对其中的每一块样式内容分别进行处理。
 *
 * @param execFileInfo - 包含文件执行信息的对象，必须包含 source（源代码）和 path（文件路径）。
 * @param pluginsList - PostCSS 插件数组，默认为空数组。
 * @returns 返回处理后的样式字符串或者是未处理的源代码。
 */
const runPostcssPlugin = async (execFileInfo: ExecFileInfo, pluginsList: PostcssPlugin[] = []) => {
  if (!pluginsList.length) {
    return execFileInfo.source
  }

  if (!execFileInfo.path.endsWith('.vue')) {
    return transform(execFileInfo, pluginsList)
  }

  // 对 .vue 文件中的样式块分别进行处理
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
