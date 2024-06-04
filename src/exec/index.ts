import * as cliProgress from '../utils/cli-progress'
import * as fs from 'fs'
import fsUtils, { writeFile } from '../utils/fs'
import { groupBy } from '../utils/common'
import mdUtils from '../utils/md'
import * as os from 'os'
import * as path from 'path'
import runBabelPlugin from '../plugins/use-babel-plugin'
import runCodemod from '../plugins/use-codemod'
import runPostcssPlugin from '../plugins/use-postcss-plugin'
import runPosthtmlPlugin from '../plugins/use-posthtml-plugin'
import { getMainWindow } from '../desktop/main-window'
import type { BabelPlugin } from '../plugins/use-babel-plugin'
import type { ExecFileInfo } from '../../types/common'
import type { FileInfo } from '../utils/fs'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
import type { Transform } from 'jscodeshift'
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

export type ExecListType = Array<RegExec>

// Exec类定义
// 重写ExecInterface接口，去除具体实现，使其成为一个纯接口定义
interface ExecInterface {
  br: string
  fsInstance: fsUtils
  fileInfoList: FileInfo[]
  classifyFilesGroup(): string
  classifyFilesGroupByRepeat(): string
  getAttrsAndAnnotation(): string
  batchRegQuery(regExpression: RegExp): string
  pageRegQuery(regExpression: RegExp, content: string): string
  batchReplaceByReg(execList: ExecListType, filterCondition?: FilterConditionType): void
  execBabelPlugin(babelPlugins: BabelPlugin[]): { successList: string[]; errorList: string[] }
  execPosthtmlPlugin(
    plugins: PosthtmlPlugin<unknown>[]
  ): Promise<{ successList: string[]; errorList: string[] }>
  execPostcssPlugin(
    plugins: PostcssPlugin[]
  ): Promise<{ successList: string[]; errorList: string[] }>
  execCodemod(codemodList: Transform[]): { successList: string[]; errorList: string[] }
  // 可能还需要添加其他方法...
}

export class Exec implements ExecInterface {
  br: string // 换行符属性
  fsInstance: fsUtils // 文件系统实例属性
  fileInfoList: FileInfo[] // 文件信息列表属性
  constructor(rootPath = path.join('src copy')) {
    this.br = os.EOL // 换行符
    /** 项目根目录，在此变更执行目录 */
    this.fsInstance = new fsUtils(rootPath)
    this.fileInfoList = this.fsInstance.getFileInfoList()
  }
  /**
   * 对文件信息列表进行分类分组，根据文件的扩展名进行分组。
   * @returns {string} 返回分类分组后的文件信息的JSON字符串。
   */
  classifyFilesGroup = (): string => {
    const group = groupBy(this.fileInfoList, 'extname')
    return JSON.stringify(group, null, 2)
  }

  /**
   * 查询并分类重复命名的文件，首先根据文件名进行分组，然后筛选出包含多个文件的组，最后对这些重复命名的文件组再次根据扩展名进行分类。
   * @returns {string} 返回包含重复命名文件的分类分组后的文件信息的JSON字符串。
   */
  classifyFilesGroupByRepeat = () => {
    const group = groupBy(this.fileInfoList, 'basename')
    const filesGroupOfRepeat = Object.values(group).filter((item) => item.group.length > 1)
    const newGroup = groupBy(filesGroupOfRepeat, 'extname')
    return JSON.stringify(newGroup, null, 2)
  }

  /**
   * 获取项目中拥有注释属性的组件信息。
   */
  getAttrsAndAnnotation = () => {
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

    const successList: string[] = [] // 执行成功列表
    const errorList: string[] = [] // 执行错误列表

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
        successList.push(filePath)
      } catch (e) {
        console.warn(e)
        errorList.push(filePath)
      }
    }
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    const targetList = this.fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    const { updateBar } = cliProgress.useCliProgress(targetList.length)
    targetList.forEach((item: FileInfo) => {
      handler(item.filePath)
      updateBar()
    })

    // 根据首字母对收集到的属性信息进行分组，并生成属性描述表格
    const attrsGroup = groupBy(attrsCollectionGroup, 'standingInitial') // 根据首字母排序

    let attributesDescriptionTable = mdUtils.createdAttributesGroupTable(attrsGroup) // 获取项目使用属性描述
    attributesDescriptionTable = attributesDescriptionTable
      .replace(/\{\{.*\}\}/g, '')
      .replace(/<.*>/g, '')

    return attributesDescriptionTable
  }

  /**
   * 批量查询函数，对所有文件内容应用正则表达式查询，并返回查询结果的字符串拼接
   * @param regExpression 正则表达式对象，用于匹配查询内容
   * @returns 查询结果的字符串拼接
   */
  batchRegQuery(regExpression: RegExp) {
    let str = ''
    this.fsInstance.filePathList.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8')
      str += mdUtils.queryContentByReg(content, regExpression)
    })
    return str
  }
  /**
   * 页面查询函数，对指定文件内容应用正则表达式查询，并返回查询结果
   * @param regExpression 正则表达式对象，用于匹配查询内容
   * @param content 指定内容查询
   * @returns 查询结果
   */
  pageRegQuery(regExpression: RegExp, content: string) {
    return mdUtils.queryContentByReg(content, regExpression)
  }

  /**
   * 根据提供正则表达式替换内容，直接传入内容，可能链式修改
   * @param reg 正则表达式对象，用于匹配需要替换的内容，必须使用全局匹配模式
   * @param content 需要进行替换操作的原始内容字符串
   * @param matchContentHandle 匹配内容处理函数，接收匹配到的内容字符串，返回替换后的内容字符串
   * @returns 返回包含替换是否发生和替换后内容的对象
   */
  replaceByReg = (
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

  /**
   * 根据正则表达式批量替换文件内容
   * @param execList 执行列表，包含正则表达式和替换处理函数
   * @param filterCondition 过滤条件，可选，用于筛选要处理的文件
   */

  batchReplaceByReg = (execList: ExecListType, filterCondition?: FilterConditionType) => {
    let restBasenameList = this.fileInfoList // 批量替换的文件信息列表

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
        const result = this.replaceByReg(exec.reg, content, exec.matchContentHandle)

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
   */
  execBabelPlugin = (babelPlugins: BabelPlugin[]) => {
    const globalExtra: Record<string, any> = {} // 用于存储全局额外信息的字典。
    const successList: string[] = [] // 执行成功列表
    const errorList: string[] = [] // 执行错误列表
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
        successList.push(filePath) // 添加到执行成功列表
      } catch (e) {
        console.warn(e) // 捕获并警告处理过程中的任何错误。
        errorList.push(filePath) // 添加到执行错误列表
      }
    }

    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue'] // 定义有效文件扩展名列表。
    const targetList = this.fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname)) // 筛选出需要处理的文件列表。
    const { updateBar } = cliProgress.useCliProgress(targetList.length) // 初始化进度条。
    // 遍历所有有效文件，逐一处理，并更新进度条
    let count = 1
    const mainWindow = getMainWindow()
    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
      mainWindow && mainWindow.setProgressBar(count++ / targetList.length)
    }
    return { successList, errorList }
  }

  /**
   * 执行PostHTML插件处理
   * @param plugins PostHTML插件数组，每个插件都是一个函数，接收一个对象作为参数，并返回处理后的结果
   * @returns 返回Promise，异步执行插件处理
   */
  execPosthtmlPlugin = async (plugins: PosthtmlPlugin<unknown>[]) => {
    // 用于存储所有文件处理过程中产生的额外全局信息
    const globalExtra: Record<string, any> = {}
    const successList: string[] = [] // 执行成功列表
    const errorList: string[] = [] // 执行错误列表
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
        successList.push(filePath)
      } catch (e) {
        // 打印错误警告
        console.warn(e)
        errorList.push(filePath)
      }
    }
    // 否则，处理项目中所有指定扩展名的文件
    const vaildList = ['.htm', '.html', '.vue', '.xml']
    // 筛选出所有有效文件
    const targetList = this.fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    // 初始化进度条，用于显示处理进度
    const { updateBar } = cliProgress.useCliProgress(targetList.length)
    // 遍历所有有效文件，逐一处理，并更新进度条
    for (const item of targetList) {
      await handler(item.filePath)
      updateBar()
    }
    return { successList, errorList }
  }

  /**
   * 执行PostCSS插件处理文件。
   * @param plugins PostCSS插件数组，将按顺序对文件内容进行处理。
   */
  execPostcssPlugin = async (plugins: PostcssPlugin[]) => {
    const successList: string[] = [] // 执行成功列表
    const errorList: string[] = [] // 执行错误列表
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
        successList.push(filePath)
      } catch (e) {
        // 捕获并警告处理过程中可能出现的错误。
        console.warn(e)
        errorList.push(filePath)
      }
    }

    // 定义有效文件扩展名列表。
    const vaildList = ['.css', '.scss', '.sass', '.less', '.styl', '.vue', '.sugarss']
    // 筛选出需要处理的文件列表。
    const targetList = this.fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    // 初始化进度条，用于批量处理文件时的进度显示。
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    // 遍历文件列表，处理每个文件，并更新进度条。
    for (const item of targetList) {
      await handler(item.filePath)
      updateBar()
    }
    return { successList, errorList }
  }

  /**
   * 使用jscodemod模板，执行一系列的代码转换操作。
   * @param codemodList 要执行的转换操作列表，每个转换操作是一个Transform类型的函数。
   */
  execCodemod = (codemodList: Transform[]) => {
    const successList: string[] = [] // 执行成功列表
    const errorList: string[] = [] // 执行错误列表
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
        successList.push(filePath)
      } catch (e) {
        // 捕获并打印转换过程中可能出现的错误
        console.warn(e)
        errorList.push(filePath)
      }
    }
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    // 筛选出符合后缀名条件的文件信息列表
    const targetList = this.fileInfoList.filter((fileInfo) => vaildList.includes(fileInfo.extname))
    // 初始化进度条，用于显示转换进度
    const { updateBar } = cliProgress.useCliProgress(targetList.length)
    // 遍历所有有效文件，逐一处理，并更新进度条
    let count = 1
    const mainWindow = getMainWindow()
    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
      mainWindow && mainWindow.setProgressBar(count++ / targetList.length)
    }
    return { successList, errorList }
  }
}
