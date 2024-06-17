import { ExecFileInfo } from '@src/types/common'
//@ts-ignore
import getParser from 'jscodeshift/src/getParser'
import jscodeshift, { Options, Parser, Transform } from 'jscodeshift'
import { logger } from '../utils/log'

/**
 * parser可传的值有 babylon、flow、ts、tsx、babel,会去获取对应的解析器
 * 定义一个代码转换器的类型，它扩展了jscodeshift的Transform类型，并可选地包含一个parser属性。
 */
import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'
import type { SFCDescriptor } from '@vue/compiler-sfc'
export type Codemod = Transform & {
  parser?: string | Parser
}

/**
 * 对给定的文件信息执行一系列的代码转换操作。
 *
 * @param execFileInfo - 包含文件路径和源代码信息的对象。
 * @param codemodList - 一个代码转换器列表，每个转换器都是一个函数，可选地接受一个parser参数。
 * @param options - jscodeshift转换选项。
 * @param lang - 可选参数，指定源代码的语言，默认为'js'。
 * @returns 经过所有转换器处理后的源代码字符串。
 */
const transform = (
  execFileInfo: ExecFileInfo,
  codemodList: Codemod[],
  options: Options,
  lang = 'js'
) => {
  try {
    // 遍历每个转换器，应用它们到源代码上
    for (const codemod of codemodList) {
      //与prettier保持一致代码格式
      const formatOptions = {
        useTabs: false,
        tabWidth: 2,
        printWidth: 100,
        singleQuote: true,
        trailingComma: 'none',
        bracketSpacing: true,
        semi: false
      }
      //使用默认解析器babel
      let parser = getParser('babel', formatOptions)
      let parserOption = codemod.parser

      // 根据源代码语言选择合适的parser
      if (typeof parserOption !== 'object') {
        if (lang.startsWith('ts')) {
          parserOption = 'ts'
        }
        if (lang.startsWith('tsx')) {
          parserOption = 'tsx'
        }
      }

      // 获取或指定parser
      if (parserOption) {
        parser =
          typeof parserOption === 'string' ? getParser(parserOption, formatOptions) : parserOption
      }
      const j = jscodeshift.withParser(parser)
      const api = {
        j,
        jscodeshift: j,
        stats: () => {},
        report: () => {}
      }
      // 执行转换器，并在有返回值时更新源代码
      const out = codemod(execFileInfo, api, options)
      if (out) {
        execFileInfo.source = out
      }
    }
    return execFileInfo.source
  } catch (e) {
    logger.error(e)
    return execFileInfo.source
  }
}

/**
 * 主函数，用于运行代码转换。
 *
 * @param execFileInfo - 包含文件路径和源代码信息的对象。
 * @param codemodList - 要应用的代码转换器列表。
 * @param options - jscodeshift转换选项。
 * @returns 经过所有指定转换器处理后的源代码字符串。
 */
export default function runCodemod(
  execFileInfo: ExecFileInfo,
  codemodList: Codemod[],
  options: Options
) {
  // 如果没有转换器，则直接返回源代码
  if (!codemodList.length) {
    return execFileInfo.source
  }
  const { path, source } = execFileInfo
  const extension = (/\.([^.]*)$/.exec(path) || [])[0]
  let lang = extension?.slice(1)
  let descriptor: SFCDescriptor

  // 针对非.vue文件的处理逻辑
  if (extension !== '.vue') {
    return transform(execFileInfo, codemodList, options, lang)
  }

  // 解析.vue文件
  descriptor = parseSFC(source, {
    filename: path
  }).descriptor

  // 针对<script>和<script setup>块的处理
  if (!descriptor.script?.content && !descriptor.scriptSetup?.content) {
    return source
  }
  if (descriptor.script && descriptor.script.content) {
    lang = descriptor.script.lang || 'js'
    execFileInfo.source = descriptor.script.content
    descriptor.script.content = transform(execFileInfo, codemodList, options, lang)
  }
  if (descriptor.scriptSetup && descriptor.scriptSetup.content) {
    lang = descriptor.scriptSetup.lang || 'js'
    execFileInfo.source = descriptor.scriptSetup.content
    descriptor.scriptSetup.content = transform(execFileInfo, codemodList, options, lang)
  }

  // 将处理后的.vue文件组件重新字符串化
  return stringifySFC(descriptor)
}
