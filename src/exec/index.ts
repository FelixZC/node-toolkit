import * as cliProgress from '../utils/cli-progress'
import * as fs from 'fs'
import fsUtils from '../utils/fs'
import { groupBy, writeFile } from '../utils/common'
import mdUtils from '../utils/md'
import * as os from 'os'
import * as path from 'path'
import runBabelPlugin from '../plugins/use-babel-plugin'
import runCodemod from '../plugins/use-codemod'
import runPostcssPlugin from '../plugins/use-postcss-plugin'
import runPosthtmlPlugin from '../plugins/use-posthtml-plugin'
import storeFile from '../query/js/stote-state'
import transferNodePropertyToJson from '../plugins/transfer-node-property-to-json'
import type { BabelPlugin } from '../plugins/use-babel-plugin'
import type { ExecFileInfo } from '../plugins/common'
import type { FileInfo } from '../utils/fs'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
import type { Transform } from 'jscodeshift'
const br = os.EOL // 换行符

/** 项目根目录，在此变更执行目录 */

const rootPath = path.join('src copy')
const fsInstance = new fsUtils(rootPath)
const fileInfoList = fsInstance.getFileInfoList()

// 定义文件属性集合接口
interface AttrsCollection {
  key: string | number
  value: string | number
  standingInitial?: string
}

// 定义正则表达式匹配结果接口
export interface RegExec {
  reg: RegExp
  matchContentHandle(content: string): string
}

// 定义过滤条件类型接口
export interface FilterConditionType {
  (item: FileInfo): boolean
}

// 获取文件系统实例的函数
export const getFsInstance = () => {
  return fsInstance
}

/**
 * 对文件进行分类分组
 * @param isQueryRepeat 是否查询重复文件
 */
export const classifyFilesGroup = (isQueryRepeat = false) => {
  /**
   * 查询并分类重复命名的文件
   */
  const classifyRepeatFileGroup = () => {
    // 按文件名分类
    const group = groupBy(fileInfoList, 'basename')

    // 过滤出重复命名的文件数组
    const filesGroupOfRepeat = Object.values(group).filter((item) => item.group.length > 1)

    // 按文件类型对重复的文件进行二次分类
    const newGroup = groupBy(filesGroupOfRepeat, 'extname')

    // 将结果写入文件
    writeFile('src/query/json/files-group-repeat.json', JSON.stringify(newGroup, null, 2))
  }

  /**
   * 查询并分类同一类型的文件
   */
  const classifyNormalFilesGroup = () => {
    // 按文件类型分类
    const group = groupBy(fileInfoList, 'extname')

    // 将结果写入文件
    writeFile('src/query/json/files-group.json', JSON.stringify(group, null, 2))
  }

  // 根据参数决定是查询重复文件还是同一类型的文件
  if (isQueryRepeat) {
    classifyRepeatFileGroup()
  } else {
    classifyNormalFilesGroup()
  }

  // 将所有文件的信息写入文件
  writeFile('src/query/json/file-list.json', JSON.stringify(fileInfoList, null, 2))
}
/**
 * 格式化文本并转换。
 * 该函数读取指定的源文件路径，对文件内容进行格式化处理（通过mdUtils.textFormat函数），然后将格式化后的内容写入目标文件路径。
 */
export const formatText = () => {
  // 定义加载并保存的文件列表，包括源文件路径和目标文件路径
  const loadAndSaveList = [
    {
      mode: 'md',
      // md文件去重
      sourceFilePath: 'src/query/md/query.md',
      targetFilePath: 'src/query/md/query.md'
    }
  ]

  // 遍历文件列表，读取源文件内容，格式化后写入目标文件
  for (const item of loadAndSaveList) {
    const fileContent = fs.readFileSync(item.sourceFilePath, 'utf-8')
    const str = mdUtils.textFormat(fileContent, item.mode)
    writeFile(item.targetFilePath, str)
  }
}

/**
 * 获取项目中拥有注释属性的组件信息。
 * @param targetPath 可选参数，指定要扫描的文件路径。
 */
export const getAttrsAndAnnotation = (targetPath?: string) => {
  // 定义使用到的babel插件列表
  const babelPluginPathList = ['../plugins/babel-plugins/extract-annotation']
  // 将插件路径列表转换为插件对象列表
  const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
    const result = require(pluginPath)

    if (result.default) {
      return result.default
    }

    return result
  })

  // 初始化存储属性信息的对象和数组
  const attrsCollectionTemp: AttrsCollection = {
    key: '',
    standingInitial: 'string',
    value: ''
  }
  const attrsCollectionGroup: AttrsCollection[] = []

  /**
   * 处理指定文件的属性信息。
   * @param filePath 文件路径
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

      // 处理和收集属性信息
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

  // 根据是否指定了targetPath来决定处理单个文件还是项目中所有文件
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

  // 根据首字母对收集到的属性信息进行分组，并生成属性描述表格
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
 * 获取自定组件Props,Methods,Slot,Event。
 * 该函数扫描指定路径下的所有文件，解析文件中的文档注释，生成组件描述的markdown文件。
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
      str += `## ${path.relative('./', filePath)}${br}`
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
 * 根据提供正则表达式进行查询
 * @param reg 正则表达式对象，用于匹配查询内容
 * @param isBatch 是否批量查询，默认为false，如果为true，则对所有文件进行查询；如果为false，只对指定文件进行查询
 * @param appointFilePath 指定查询的文件路径，仅在isBatch为false时有效
 */
export const queryByReg = (reg: RegExp, isBatch = false, appointFilePath?: string) => {
  const writeFilePath = 'src/query/md/query.md'
  let result = '' // 用于存储批量查询的结果

  /**
   * 批量查询函数，对所有文件内容应用正则表达式查询，并返回查询结果的字符串拼接
   * @param regExpression 正则表达式对象，用于匹配查询内容
   * @returns 查询结果的字符串拼接
   */
  const batchQuery = (regExpression: RegExp) => {
    let str = ''
    fsInstance.filePathList.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8')
      str += mdUtils.queryContentByReg(content, regExpression)
    })
    return str
  } // 批量查询实现

  /**
   * 页面查询函数，对指定文件内容应用正则表达式查询，并返回查询结果
   * @param regExpression 正则表达式对象，用于匹配查询内容
   * @returns 查询结果
   */
  const pageQuery = (regExpression: RegExp) => {
    const readFilePath = appointFilePath || 'src/query/md/query.md'
    const content = fs.readFileSync(readFilePath, 'utf-8')
    const result = mdUtils.queryContentByReg(content, regExpression)

    if (result) {
      return result
    }

    return ''
  }

  // 根据isBatch的值选择进行批量查询还是页面查询，并将结果写入文件
  if (isBatch) {
    result = batchQuery(reg)
  } else {
    result = pageQuery(reg)
  }

  writeFile(writeFilePath, result)
}

/**
 * 根据提供正则表达式替换内容，直接传入内容，可能链式修改
 * @param reg 正则表达式对象，用于匹配需要替换的内容，必须使用全局匹配模式
 * @param content 需要进行替换操作的原始内容字符串
 * @param matchContentHandle 匹配内容处理函数，接收匹配到的内容字符串，返回替换后的内容字符串
 * @returns 返回包含替换是否发生和替换后内容的对象
 */
export const replaceByReg = (
  reg: RegExp,
  content: string,
  matchContentHandle: (content: string) => string
) => {
  let localContent = content // 存储进行替换操作的内容字符串

  if (!reg.global) {
    throw new Error('正则必须使用全局匹配模式')
  }

  let result
  let isChange = false // 标识内容是否发生了替换

  // 循环执行替换操作，直到没有匹配的内容为止
  while ((result = reg.exec(localContent))) {
    const matchContent = result[0] // 匹配到的内容

    const leftIndex = result.index
    const rightIndex = leftIndex + matchContent.length
    const resultLeft = localContent.slice(0, leftIndex)
    const resultRight = localContent.slice(rightIndex)
    let replaceResult = ''

    // 如果正则匹配结果中有命名组，则使用命名组进行替换；否则，直接使用匹配的内容进行替换
    if (result.groups?.target) {
      replaceResult = matchContent.replace(
        result.groups.target,
        matchContentHandle(result.groups.target)
      )
    } else {
      replaceResult = matchContentHandle(matchContent)
    }

    // 如果替换结果与匹配内容不同，则标记内容发生了替换
    if (replaceResult !== matchContent) {
      isChange = true
    }

    // 更新内容字符串，进行下一次替换操作
    localContent = resultLeft + replaceResult + resultRight
    // 调整正则表达式的 lastIndex，以避免重复替换相同内容
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
 * @param execList 执行列表，包含正则表达式和替换处理函数
 * @param filterCondition 过滤条件，可选，用于筛选要处理的文件
 */

export const batchReplaceByReg = (
  execList: ExecListType,
  filterCondition?: FilterConditionType
) => {
  let restBasenameList = fileInfoList // 批量替换的文件信息列表

  // 如果提供了过滤条件，筛选符合条件的文件信息
  if (typeof filterCondition === 'function') {
    restBasenameList = restBasenameList.filter(filterCondition)
  }

  // 遍历文件信息列表，对每个文件进行内容替换
  restBasenameList.forEach((item) => {
    let content = fs.readFileSync(item.filePath, 'utf-8') // 读取文件内容
    let isChange = false // 标记内容是否发生了替换

    // 遍历执行列表，对文件内容进行多次正则替换
    for (const exec of execList) {
      const result = replaceByReg(exec.reg, content, exec.matchContentHandle)

      // 如果替换结果指示内容发生了变化，则更新内容标记和替换后的内容
      if (result.isChange) {
        isChange = true
        content = result.localContent
      }
    }

    // 如果内容发生了替换，将替换后的内容写回文件
    if (isChange) {
      writeFile(item.filePath, content)
    }
  })
}

/**
 * 执行Babel插件处理给定的文件或文件集。
 * @param babelPlugins Babel插件数组，将对目标文件应用这些插件。
 * @param targetPath 可选；单个文件的目标路径，如果提供，则只处理这个文件；如果未提供，则处理所有匹配的文件。
 */
export const execBabelPlugin = (babelPlugins: BabelPlugin[], targetPath?: string) => {
  if (!babelPlugins.length) {
    return // 当没有提供Babel插件时，直接返回不做任何处理。
  }

  const globalExtra: Record<string, any> = {} // 用于存储全局额外信息的字典。

  /**
   * 处理单个文件，应用Babel插件并更新文件内容。
   * @param filePath 文件路径。
   */
  const handler = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8') // 读取文件内容。
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content,
        extra: {}
      }
      const newContent = runBabelPlugin(execFileInfo, babelPlugins) // 应用Babel插件。

      // 如果文件信息中的额外信息非空，则存储到全局额外信息中。
      if (Object.keys(execFileInfo.extra!).length) {
        globalExtra[filePath] = execFileInfo.extra
      }

      // 如果文件内容未改变或新内容为空，则不写入文件。
      if (newContent === content || !newContent.length) {
        return
      }

      writeFile(filePath, newContent) // 写入处理后的新内容。
    } catch (e) {
      console.warn(e) // 捕获并警告处理过程中的任何错误。
    }
  }

  if (targetPath) {
    handler(targetPath) // 如果提供了目标路径，只处理这个文件。
  } else {
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue'] // 定义有效文件扩展名列表。
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname)) // 筛选出需要处理的文件列表。
    const { updateBar } = cliProgress.useCliProgress(targetList.length) // 初始化进度条。

    // 遍历文件列表，处理每个文件并更新进度条。
    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
    }
  }

  // 最后，将全局额外信息写入到json文件中。
  writeFile('src/query/json/global-extra.json', JSON.stringify(globalExtra))
}

/**
 * 执行PostHTML插件处理
 * @param plugins PostHTML插件数组，每个插件都是一个函数，接收一个对象作为参数，并返回处理后的结果
 * @param targetPath 可选参数，指定要处理的单个文件路径。如果未提供，则处理整个项目中的所有.html,.htm,.vue和.xml文件
 * @returns 返回Promise，异步执行插件处理
 */
export const execPosthtmlPlugin = async (
  plugins: PosthtmlPlugin<unknown>[],
  targetPath?: string
) => {
  // 用于存储所有文件处理过程中产生的额外全局信息
  const globalExtra: Record<string, any> = {}

  // 处理单个文件的函数
  const handler = async (filePath: string) => {
    try {
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf-8')
      // 准备文件信息，包括额外信息、文件路径和源内容
      const execFileInfo: ExecFileInfo = {
        extra: {},
        path: filePath,
        source: content
      }
      // 运行所有插件，对文件内容进行处理
      const result = await runPosthtmlPlugin(execFileInfo, plugins)
      // 移除处理结果中的特定占位符
      const newContent = result.replace(/=["]_pzc_["]/g, '')

      // 合并此文件处理过程产生的额外信息到全局额外信息中
      for (const key in execFileInfo.extra) {
        globalExtra[key] = execFileInfo.extra[key]
      }

      // 如果新内容与原内容相同或新内容为空，则不进行写入操作
      if (newContent === content || !newContent.length) {
        return
      }

      // 写入处理后的内容到文件
      writeFile(filePath, newContent)
    } catch (e) {
      // 打印错误警告
      console.warn(e)
    }
  }

  // 如果提供了targetPath，则只处理这个文件
  if (targetPath) {
    await handler(targetPath)
  } else {
    // 否则，处理项目中所有指定扩展名的文件
    const vaildList = ['.htm', '.html', '.vue', '.xml']
    // 筛选出所有有效文件
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    // 初始化进度条，用于显示处理进度
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    // 遍历所有有效文件，逐一处理，并更新进度条
    for (const item of targetList) {
      await handler(item.filePath)
      updateBar()
    }
  }

  // 将全局额外信息写入到指定文件
  writeFile('src/query/json/global-extra.json', JSON.stringify(globalExtra))
}

/**
 * 执行PostCSS插件处理文件。
 * @param plugins PostCSS插件数组，将按顺序对文件内容进行处理。
 * @param targetPath 可选，指定要处理的单个文件路径。如果未提供，则处理工作目录中所有指定扩展名的文件。
 */
export const execPostcssPlugin = async (plugins: PostcssPlugin[], targetPath?: string) => {
  // 定义一个处理单个文件的异步函数。
  const handler = async (filePath: string) => {
    try {
      // 读取文件内容。
      const content = fs.readFileSync(filePath, 'utf-8')
      // 准备文件信息，以供插件处理使用。
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content
      }
      // 使用插件处理文件内容。
      const result = await runPostcssPlugin(execFileInfo, plugins)

      // 如果处理结果与原内容相同或结果为空，则不进行写入操作。
      if (result === content || !result.length) {
        return
      }

      // 将处理后的内容写回文件。
      writeFile(filePath, result)
    } catch (e) {
      // 捕获并警告处理过程中可能出现的错误。
      console.warn(e)
    }
  }

  // 如果提供了targetPath，则只处理这个文件。
  if (targetPath) {
    await handler(targetPath)
  } else {
    // 定义有效文件扩展名列表。
    const vaildList = ['.css', '.scss', '.sass', '.less', '.styl', '.vue', '.sugarss']
    // 筛选出需要处理的文件列表。
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    // 初始化进度条，用于批量处理文件时的进度显示。
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    // 遍历文件列表，处理每个文件，并更新进度条。
    for (const item of targetList) {
      await handler(item.filePath)
      updateBar()
    }
  }
}

/**
 * 使用jscodemod模板，执行一系列的代码转换操作。
 * @param codemodList 要执行的转换操作列表，每个转换操作是一个Transform类型的函数。
 * @param targetPath 可选参数，指定要转换的单个文件路径。如果未提供，则转换指定目录下所有符合后缀名的文件。
 */
export const execCodemod = (codemodList: Transform[], targetPath?: string) => {
  // 如果转换操作列表为空，则直接返回，不执行任何操作
  if (!codemodList.length) {
    return
  }

  // 定义一个处理函数，用于处理单个文件的转换
  const handler = (filePath: string) => {
    try {
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf-8')
      // 准备转换所需的文件信息
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content
      }
      // 执行所有转换操作，并获取转换后的内容
      const newContent = runCodemod(execFileInfo, codemodList, {})

      // 如果转换后的内容与原内容相同或转换后的内容为空，则不进行写入操作
      if (newContent === content || !newContent.length) {
        return
      }

      // 将转换后的内容写入文件
      writeFile(filePath, newContent)
    } catch (e) {
      // 捕获并打印转换过程中可能出现的错误
      console.warn(e)
    }
  }

  // 如果提供了targetPath，则只处理这个文件
  if (targetPath) {
    handler(targetPath)
  } else {
    // 否则，处理指定目录下所有符合特定后缀名的文件
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    // 筛选出符合后缀名条件的文件信息列表
    const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    // 初始化进度条，用于显示转换进度
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    // 遍历文件列表，对每个文件执行转换操作，并更新进度条
    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
    }
  }
}

/**
 * 将指定文件中的节点属性转换为JSON格式。
 * 该函数首先遍历文件信息列表，筛选出特定后缀名（如.vue）的文件。
 * 然后，对每个筛选出的文件执行以下操作：
 * 1. 读取文件内容。
 * 2. 创建包含文件路径、原始内容和一个空额外信息对象的执行文件信息对象。
 * 3. 使用transferNodePropertyToJson函数处理执行文件信息对象，将节点属性转换为JSON。
 * 4. 如果转换后的内容与原始内容不同且非空，则将新内容写回文件。
 *
 * 注：该函数不处理任何异常，错误信息仅打印到控制台。
 */
export const execTransferNodePropertyToJson = () => {
  // 定义处理单个文件的函数
  const handler = (filePath: string) => {
    try {
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf-8')
      // 创建执行文件信息对象
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content,
        extra: {}
      }
      // 转换节点属性到JSON
      const newContent = transferNodePropertyToJson(execFileInfo)

      // 如果新内容与原内容相同或新内容为空，则不进行任何操作
      if (newContent === content || !newContent.length) {
        return
      }

      // 将转换后的内容写回文件
      writeFile(filePath, newContent)
    } catch (e) {
      // 打印错误信息
      console.warn(e)
    }
  }

  // 定义有效文件类型列表
  const vaildList = ['.vue']
  // 筛选出目标文件列表
  const targetList = fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
  // 初始化进度条
  const { updateBar } = cliProgress.useCliProgress(targetList.length)

  // 遍历目标文件列表，处理每个文件并更新进度条
  for (const item of targetList) {
    handler(item.filePath)
    updateBar()
  }
}
