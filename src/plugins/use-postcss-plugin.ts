import postcss from 'postcss'
import path from 'path'
import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'
import type { ExecFileInfo } from '../../types/common'
import type { AcceptedPlugin } from 'postcss'
import postcssLess from 'postcss-less'
import postcssSass from 'postcss-sass'
import postcssScss from 'postcss-scss'
// @ts-ignore
import postcssStyl from 'postcss-styl'
import postcssSafeParser from 'postcss-safe-parser'
// @ts-ignore
import sugarss from 'sugarss'
import type { Syntax, Parser } from 'postcss'
import { logger } from '../utils/log'
import postcssHtml from 'postcss-html'
// @ts-ignore
import postcssMarkdown from 'postcss-markdown'
// @ts-ignore
import postcssJsx from 'postcss-jsx'
const getDefaultSyntax = (stypeType: string): Syntax | Parser => {
  if (/\.(?:[sx]?html?|[sx]ht|ux|php)$/i.test(stypeType)) {
    return postcssHtml
  } else if (/\.(?:markdown|md)$/i.test(stypeType)) {
    return postcssMarkdown
  } else if (/\.(?:[cm]?[jt]sx?|es\d*|pac)$/i.test(stypeType)) {
    return postcssJsx
  } else {
    return postcssSafeParser
  }
}
/**
 * 根据给定的类型获取对应的解析器。
 */
const getSyntax = (stypeType: string): Syntax | Parser => {
  switch (stypeType) {
    case 'less':
      return postcssLess
    case 'sass':
      return postcssSass
    case 'scss':
      return postcssScss
    case 'stylus':
      return postcssStyl
    case 'css':
      return postcssSafeParser
    case 'sss':
      return sugarss
    default:
      return getDefaultSyntax(stypeType)
  }
}

/**
 * 处理和转换样式的工具函数。
 */
const transform = async (
  execFileInfo: ExecFileInfo,
  pluginsList: AcceptedPlugin[],
  styleType: string
) => {
  try {
    const result = await postcss(pluginsList).process(execFileInfo.source, {
      from: execFileInfo.path,
      parser: getSyntax(styleType)
    })
    return result.css
  } catch (error) {
    logger.error('PostCSS processing error:', error)
    throw error
  }
}

/**
 * 运行 PostCSS 插件。
 */
const runPostcssPlugin = async (execFileInfo: ExecFileInfo, pluginsList: AcceptedPlugin[] = []) => {
  if (!pluginsList.length) {
    return execFileInfo.source
  }

  if (!execFileInfo.path.endsWith('.vue')) {
    return transform(execFileInfo, pluginsList, path.extname(execFileInfo.path).slice(1))
  }

  const { descriptor } = parseSFC(execFileInfo.source, { filename: execFileInfo.path })
  const styles = descriptor.styles

  if (styles.length) {
    for (const style of styles) {
      execFileInfo.source = style.content
      style.content = await transform(execFileInfo, pluginsList, style.lang || 'css')
    }
  }

  return stringifySFC(descriptor)
}

export default runPostcssPlugin
