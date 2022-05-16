import { groupBy, writeFile } from '../utils/common'
import * as cliProgress from '../utils/cli-progress'
import * as fs from 'fs'
import fsUtils from '../utils/fs'
import mdUtils from '../utils/md'
import * as os from 'os'
import * as path from 'path'
import runBabelPlugin from '../plugins/use-babel-plugin'
import runCodemod from '../plugins/use-js-codemod'
import runPostcssPlugin from '../plugins/use-postcss-plugin'
import runPosthtmlPlugin from '../plugins/use-posthtml-plugin'
import storeFile from '../query/js/stote-state'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { Transform } from 'jscodeshift'
import type { FileInfo } from '../utils/fs'
import type { ExecFileInfo } from '../plugins/common'
import type { BabelPlugin } from '../plugins/use-babel-plugin'
const br = os.EOL // 换行符

/** 项目根目录，在此变更执行目录 */

const rootPath = path.join('src-copy')
const fsInstance = new fsUtils(rootPath)
const fileInfoList = fsInstance.getFileInfoList()
interface AttrsCollection {
  key: string | number
  value: string | number
  standingInitial?: string
}
export interface RegExec {
  reg: RegExp
  matchContentHandle(content: string): string
}
export interface FilterConditionType {
  (item: FileInfo): boolean
}
export const getFsInstance = () => {
  return fsInstance
}
/**
 * 文件分类
 * @param isQueryRepeat
 */

export const classifyFilesGroup = (isQueryRepeat = false) => {
  /** 查询命名重复 */
  const classifyRepeatFileGroup = () => {
    const group = groupBy(fileInfoList, 'basename') // 按文件名分类

    const filesGroupOfRepeat = Object.values(group).filter((item) => item.group.length > 1) // 过滤重复命名数组

    const newGroup = groupBy(filesGroupOfRepeat, 'extname') // 再按文件类型分类

    writeFile('src/query/json/files-group-repeat.json', JSON.stringify(newGroup, null, 2))
  }
  /** 查询同一类型文件 */

  const classifyNormalFilesGroup = () => {
    const group = groupBy(fileInfoList, 'extname') // 按文件类型分类

    writeFile('src/query/json/files-group.json', JSON.stringify(group, null, 2))
  }

  if (isQueryRepeat) {
    classifyRepeatFileGroup()
  } else {
    classifyNormalFilesGroup()
  }
}
/**
 * 文本转化并格式
 */

export const formatText = () => {
  const loadAndSaveList = [
    {
      mode: 'md',
      // md文件去重
      sourceFilePath: 'src/query/md/query.md',
      targetFilePath: 'src/query/md/query.md'
    },
    {
      mode: 'txtToTxt',
      // 每日n句去重
      sourceFilePath: 'src/query/txt/每日n句.txt',
      targetFilePath: 'src/query/txt/每日n句.txt'
    },
    {
      mode: 'txtToMd',
      // 每日n句转md
      sourceFilePath: 'src/query/txt/每日n句.txt',
      targetFilePath: 'src/query/md/sentence.md'
    }
  ]

  for (const item of loadAndSaveList) {
    const fileContent = fs.readFileSync(item.sourceFilePath, 'utf-8')
    const str = mdUtils.textFormat(fileContent, item.mode)
    writeFile(item.targetFilePath, str)
  }
}
/**
 * 获取项目中拥有注释属性
 * @param targetPath
 */

export const getAttrsAndAnnotation = (targetPath?: string) => {
  const babelPluginPathList = ['../plugins/babel-plugins/extract-annotation']
  const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
    const result = require(pluginPath)

    if (result.default) {
      return result.default
    }

    return result
  })
  /** 所有属性描述对象 */

  const attrsCollectionTemp: AttrsCollection = {
    key: '',
    standingInitial: 'string',
    value: ''
  }
  /** 所有属性描述对象数组 */

  const attrsCollectionGroup: AttrsCollection[] = []
  /**
   * 根据首字母分类属性描述对象数组
   * @param filePath
   */

  const handler = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        extra: {
          attributesObj: {}
        },
        path: filePath,
        source: content
      } // 不需要新内容

      runBabelPlugin(execFileInfo, plugins)
      const attributesObj = execFileInfo.extra!.attributesObj as Record<string, string>

      if (Object.keys(attributesObj).length) {
        for (const [key, value] of Object.entries(attributesObj)) {
          // 冲突处理
          if (Reflect.get(attrsCollectionTemp, key)) {
            const newKey = `${key}:arrow_right:(in ${path.basename(filePath)})`

            if (
              Reflect.get(attrsCollectionTemp, newKey) === value ||
              Reflect.get(attrsCollectionTemp, key) === value
            ) {
              continue
            }

            Reflect.set(attrsCollectionTemp, newKey, value)
            attrsCollectionGroup.push({
              key: newKey,
              standingInitial: newKey.slice(0, 1).toLocaleUpperCase(),
              value
            })
          } else {
            Reflect.set(attrsCollectionTemp, key, value)
            attrsCollectionGroup.push({
              key,
              standingInitial: key.slice(0, 1).toLocaleUpperCase(),
              value
            })
          }
        }
      }
    } catch (e) {
      console.warn(e)
    }
  }

  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    const { updateBar } = cliProgress.useCliProgress(targetList.length)
    targetList.forEach((item: FileInfo) => {
      handler(item.filePath)
      updateBar()
    })
  }

  const attrsGroup = groupBy(attrsCollectionGroup, 'standingInitial') // 根据首字母排序

  const attributesDescriptionTable = mdUtils.createdAttributesGroupTable(attrsGroup) // 获取项目使用属性描述

  writeFile(
    'src/query/md/attributes-description-table.md',
    attributesDescriptionTable.replace(/\{\{.*\}\}/g, '').replace(/<.*>/g, '')
  )
  const storeTable = mdUtils.createdStoreTable(storeFile, attrsCollectionTemp) // 获取store属性描述

  writeFile(
    'src/query/md/store-table.md',
    storeTable.replace(/\{\{.*\}\}/g, '').replace(/<.*>/g, '')
  )
  writeFile('src/query/json/attrs-collection.json', JSON.stringify(attrsCollectionTemp))
}
/**
 * 获取自定组件Props,Methods,Slot,Event
 * @returns
 */

export const getComponentDescription = () => {
  const writeFilePath = 'src/query/md/component-description.md'
  const filePathList = fsInstance.filePathList.sort((filePath1, filePath2) => {
    return path.basename(filePath1).localeCompare(path.basename(filePath2))
  })
  let str = ''
  const { updateBar } = cliProgress.useCliProgress(filePathList.length)
  filePathList.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const mdContent = mdUtils.parseDocs(content, {
      md: true
    })
    if (mdContent.length) {
      str += `## ${path.relative('./', filePath)}` + br
      str += mdContent + br
    }

    updateBar()
  })

  if (!str.length) {
    return
  }

  writeFile(writeFilePath, str)
}
/**
 * 根据提供正则查询
 * @param reg
 * @param isBatch
 * @param appointFilePath
 */

export const queryByReg = (reg: RegExp, isBatch = false, appointFilePath?: string) => {
  const writeFilePath = 'src/query/md/query.md'
  let result = '' // 批量查询

  const batchQuery = (regExpression: RegExp) => {
    let str = ''
    fsInstance.filePathList.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8')
      str += mdUtils.queryContentByReg(content, regExpression)
    })
    return str
  } // 指定查询

  const pageQuery = (regExpression: RegExp) => {
    const readFilePath = appointFilePath || 'src/query/md/query.md'
    const content = fs.readFileSync(readFilePath, 'utf-8')
    const result = mdUtils.queryContentByReg(content, regExpression)

    if (result) {
      return result
    }

    return ''
  }

  if (isBatch) {
    result = batchQuery(reg)
  } else {
    result = pageQuery(reg)
  }

  writeFile(writeFilePath, result)
}
/**
 * 根据提供正则替换替换内容，直接传入内容，可能链式修改
 * @param reg
 * @param content
 * @param matchContentHandle
 * @returns
 */

export const replaceByReg = (
  reg: RegExp,
  content: string,
  matchContentHandle: (content: string) => string
) => {
  let localContent = content

  if (!reg.global) {
    throw new Error('正则必须使用全局匹配模式')
  }

  let result
  let isChange = false

  while ((result = reg.exec(localContent))) {
    const matchContent = result[0] // 有命名指定用指定，没有就使用默认匹配

    const leftIndex = result.index
    const rightIndex = leftIndex + matchContent.length
    const resultLeft = localContent.slice(0, leftIndex)
    const resultRight = localContent.slice(rightIndex)
    let replaceResult = ''

    if (result.groups?.target) {
      replaceResult = matchContent.replace(
        result.groups.target,
        matchContentHandle(result.groups.target)
      )
    } else {
      replaceResult = matchContentHandle(matchContent)
    }

    if (replaceResult !== matchContent) {
      isChange = true
    }

    localContent = resultLeft + replaceResult + resultRight // 移动位置避免替代重复内容

    reg.lastIndex = (resultLeft + replaceResult).length
  }

  return {
    isChange,
    localContent
  }
}
export type ExecListType = Array<RegExec>
/**
 * 根据正则表达式批量替换文件内容
 * @param execList
 * @param filterCondition
 */

export const batchReplaceByReg = (
  execList: ExecListType,
  filterCondition?: FilterConditionType
) => {
  let restBasenameList = fileInfoList // 批量替换

  if (typeof filterCondition === 'function') {
    restBasenameList = restBasenameList.filter(filterCondition)
  }

  restBasenameList.forEach((item) => {
    let content = fs.readFileSync(item.filePath, 'utf-8')
    let isChange = false

    for (const exec of execList) {
      const result = replaceByReg(exec.reg, content, exec.matchContentHandle)

      if (result.isChange) {
        isChange = true
        content = result.localContent
      }
    }

    if (isChange) {
      writeFile(item.filePath, content)
    }
  })
}
/**
 * 使用babel插件
 * @param babelPlugins
 * @param targetPath
 * @returns
 */

export const execBabelPlugin = (babelPlugins: BabelPlugin[], targetPath?: string) => {
  if (!babelPlugins.length) {
    return
  }

  const globalExtra: Record<string, any> = {}

  const handler = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content,
        extra: {}
      }
      const newContent = runBabelPlugin(execFileInfo, babelPlugins)

      if (Object.keys(execFileInfo.extra!).length) {
        globalExtra[filePath] = execFileInfo.extra
      }

      if (newContent === content || !newContent.length) {
        return
      }

      writeFile(filePath, newContent)
    } catch (e) {
      console.warn(e)
    }
  }

  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
    }
  }
  /** 存储全局文件缓存信息 */

  writeFile('src/query/json/global-extra.json', JSON.stringify(globalExtra))
}
/**
 * 使用psthtml插件
 * @param plugins
 * @param targetPath
 */

export const execPosthtmlPlugin = async (
  plugins: PosthtmlPlugin<unknown>[],
  targetPath?: string
) => {
  const globalExtra: Record<string, any> = {}

  const handler = async (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        extra: {},
        path: filePath,
        source: content
      }
      const result = await runPosthtmlPlugin(execFileInfo, plugins)
      const newContent = result.replace(/=["]_pzc_["]/g, '')

      for (const key in execFileInfo.extra) {
        globalExtra[key] = execFileInfo.extra[key]
      }

      if (newContent === content || !newContent.length) {
        return
      }
      /** 替换掉_pzc_填充位 */

      writeFile(filePath, newContent)
    } catch (e) {
      console.warn(e)
    }
  }

  if (targetPath) {
    await handler(targetPath)
  } else {
    const vaildList = ['.htm', '.html', '.vue', '.xml']
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    for (const item of targetList) {
      await handler(item.filePath)
      updateBar()
    }
  }

  writeFile('src/query/json/global-extra.json', JSON.stringify(globalExtra))
}
/**
 * 执行postcss插件
 * @param plugins
 * @param targetPath
 */

export const execPostcssPlugin = async (plugins: PostcssPlugin[], targetPath?: string) => {
  const handler = async (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content
      }
      const result = await runPostcssPlugin(execFileInfo, plugins)

      if (result === content || !result.length) {
        return
      }

      writeFile(filePath, result)
    } catch (e) {
      console.warn(e)
    }
  }

  if (targetPath) {
    await handler(targetPath)
  } else {
    const vaildList = ['.css', '.scss', '.sass', '.less', '.styl', '.vue', '.sugarss']
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    for (const item of targetList) {
      await handler(item.filePath)
      updateBar()
    }
  }
}
/**
 * 执行jscodemod模板
 * @param codemodList
 * @param targetPath
 * @returns
 */

export const execCodemod = (codemodList: Transform[], targetPath?: string) => {
  if (!codemodList.length) {
    return
  }

  const handler = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content
      }
      const newContent = runCodemod(execFileInfo, codemodList)

      if (newContent === content || !newContent.length) {
        return
      }

      writeFile(filePath, newContent)
    } catch (e) {
      console.warn(e)
    }
  }

  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
    }
  }
}
