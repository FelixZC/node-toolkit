//@ts-ignore
import getParser from 'jscodeshift/src/getParser'
import jscodeshift, { Parser, Transform, Options } from 'jscodeshift'
import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'
import type { SFCDescriptor } from '@vue/compiler-sfc'
import { ExecFileInfo } from './common'
/**
 * parser可传的值有 babylon、flow、ts、tsx、babel,会去获取对应的解析器
 */
export type Codemod = Transform & {
  parser?: string | Parser
}
const transform = (
  execFileInfo: ExecFileInfo,
  codemodList: Codemod[],
  options: Options,
  lang = 'js'
) => {
  try {
    for (const codemod of codemodList) {
      let parser = getParser()
      let parserOption = codemod.parser
      if (typeof parserOption !== 'object') {
        if (lang.startsWith('ts')) {
          parserOption = 'ts'
        }
        if (lang.startsWith('tsx')) {
          parserOption = 'tsx'
        }
      }
      if (parserOption) {
        parser = typeof parserOption === 'string' ? getParser(parserOption) : parserOption
      }
      const j = jscodeshift.withParser(parser)
      const api = {
        j,
        jscodeshift: j,
        stats: () => {},
        report: () => {}
      }
      const out = codemod(execFileInfo, api, options)
      if (out) {
        execFileInfo.source = out
      }
    }
    return execFileInfo.source
  } catch (e) {
    console.error(e)
    return execFileInfo.source
  }
}
export default function runCodemod(
  execFileInfo: ExecFileInfo,
  codemodList: Codemod[],
  options: Options
) {
  if (!codemodList.length) {
    return execFileInfo.source
  }
  const { path, source } = execFileInfo
  const extension = (/\.([^.]*)$/.exec(path) || [])[0]
  let lang = extension.slice(1)
  let descriptor: SFCDescriptor
  if (extension !== '.vue') {
    return transform(execFileInfo, codemodList, options, lang)
  }

  descriptor = parseSFC(source, { filename: path }).descriptor
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

  return stringifySFC(descriptor)
}
