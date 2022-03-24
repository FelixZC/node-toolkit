import { parse as parseSFC, stringify as stringifySFC } from './sfc-utils'
import createDebug from 'debug' // @ts-ignore

import getParser from 'jscodeshift/src/getParser'
import jscodeshift, { Parser, Transform } from 'jscodeshift'
import VueTransformation from './vuecodemods/vue-transformation'
/**
 * The following file is adapted from https://github.com/vuejs/vue-codemod.git
 */

import type { SFCDescriptor } from './sfc-utils'
const debug = createDebug('vue-codemod')
type FileInfo = {
  path: string
  source: string
}
type JSTransformation = Transform & {
  parser?: string | Parser
}
type JSTransformationModule =
  | JSTransformation
  | {
      default: Transform
      parser?: string | Parser
    }
type VueTransformationModule =
  | VueTransformation
  | {
      default: VueTransformation
    }
type TransformationModule = JSTransformationModule | VueTransformationModule
export default function runTransformation(
  fileInfo: FileInfo,
  transformationModule: TransformationModule,
  params: object = {}
) {
  let transformation: VueTransformation | JSTransformation // @ts-ignore

  if (typeof transformationModule.default !== 'undefined') {
    // @ts-ignore
    transformation = transformationModule.default
  } else {
    transformation = transformationModule
  }

  if (transformation instanceof VueTransformation) {
    debug('TODO: Running VueTransformation')
    return fileInfo.source
  }

  debug('Running jscodeshift transform')
  const { path, source } = fileInfo
  const extension = (/\.([^.]*)$/.exec(path) || [])[0]
  let lang = extension.slice(1)
  let descriptor: SFCDescriptor

  if (extension === '.vue') {
    descriptor = parseSFC(source, {
      filename: path
    }).descriptor // skip .vue files without script block

    const scriptBlock = descriptor.script || descriptor.scriptSetup

    if (!scriptBlock) {
      return source
    }

    lang = scriptBlock.lang || 'js'
    fileInfo.source = scriptBlock.content
  }

  let parser = getParser()
  let parserOption = (transformationModule as JSTransformationModule).parser // force inject `parser` option for .tsx? files, unless the module specifies a custom implementation

  if (typeof parserOption !== 'object') {
    if (lang.startsWith('ts')) {
      parserOption = lang
    }
  }

  if (parserOption) {
    parser = typeof parserOption === 'string' ? getParser(parserOption) : parserOption
  }

  const j = jscodeshift.withParser(parser)
  const api = {
    j,
    jscodeshift: j,
    report: () => {},
    stats: () => {}
  }
  const out = transformation(fileInfo, api, params)

  if (!out) {
    return source // skipped
  } // need to reconstruct the .vue file from descriptor blocks

  if (extension === '.vue') {
    const scriptBlock = descriptor!.script || descriptor!.scriptSetup

    if (out === scriptBlock?.content) {
      return source // skipped, don't bother re-stringifying
    }

    scriptBlock!.content = out
    descriptor!.script = scriptBlock
    return stringifySFC(descriptor!)
  }

  return out
}
