import { writeFile } from '../utils/common'
import babel from '@babel/core'
import * as cliProgress from '../utils/cli-progress'
import * as fs from 'fs'
import fsUtils from '../utils/fs'
import getPostcssPluginActuator from '../plugins/usePostcssPlugin'
import getPosthtmlPluginActuator from '../plugins/usePosthtmlPlugin'
import mdUtils, { GroupCache } from '../utils/md'
import * as os from 'os'
import * as path from 'path'
import runBabelPlugin from '../plugins/useBabelPlugin'
import runCodemod from '../plugins/useJsCodemod'
import storeFile from '../query/js/stote-state'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import type { Transform } from 'jscodeshift'
import type { FileInfo } from '../utils/fs'
import type { ExecFileInfo } from '../plugins/common'
import type { BabelPlugin } from '../plugins/useBabelPlugin'
const br = os.EOL //换行符

const rootPath = path.join('src')
const fsInstance = new fsUtils(rootPath)
const fileInfoList = fsInstance.getFileInfoList()
interface AttrsCollection {
  key: string | number
  value: string | number
  standingInitial?: string
}
interface SourceItem {
  filename: string
  target: string
}
interface RouteTemplate {
  path: string
  name: string
  component: string
  meta: {
    title: string
    keepAlive: boolean
  }
}
interface ExcelPosition {
  load: string
  save: string
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
} //文件分类

export const classifyFilesGroup = (isQueryRepeat = false) => {
  //查询命名重复
  const classifyRepeatFileGroup = () => {
    let group = mdUtils.groupBy(fileInfoList, 'basename') //按文件名分类

    const filesGroupOfRepeat = Object.values(group).filter(
      (item: GroupCache) => item.group.length > 1
    ) //过滤重复命名数组

    group = mdUtils.groupBy(filesGroupOfRepeat, 'extname') //再按文件类型分类

    writeFile(
      'src/query/json/files-group-repeat.json',
      JSON.stringify(group, null, 2)
    )
  } //查询同一类型文件

  const classifyNormalFilesGroup = () => {
    const group = mdUtils.groupBy(fileInfoList, 'extname') //按文件类型分类

    writeFile(
      'src/query/json/files-group.json',
      JSON.stringify(group, null, 2)
    )
  }

  if (isQueryRepeat) {
    classifyRepeatFileGroup()
  } else {
    classifyNormalFilesGroup()
  }
} //文本转化并格式

export const formatText = () => {
  const loadAndSaveList = [
    {
      mode: 'md',
      //md文件去重
      sourceFilePath: 'src/query/md/query.md',
      targetFilePath: 'src/query/md/query.md',
    },
    {
      mode: 'txtToTxt',
      //每日n句去重
      sourceFilePath: 'src/query/txt/每日n句.txt',
      targetFilePath: 'src/query/txt/每日n句.txt',
    },
    {
      mode: 'txtToMd',
      //每日n句转md
      sourceFilePath: 'src/query/txt/每日n句.txt',
      targetFilePath: 'src/query/md/sentence.md',
    },
  ]

  for (const item of loadAndSaveList) {
    const fileContent = fs.readFileSync(item.sourceFilePath, 'utf-8')
    const str = mdUtils.textFormat(fileContent, item.mode)
    writeFile(item.targetFilePath, str)
  }
} //路由生成

export const generateRouter = () => {
  const queryReg =
    /(?<tagInfo><(?<tag>title).*>)(?<tagContent>[\s\S]*?)<\/title>/
  let result
  const routes: RouteTemplate[] = []
  fileInfoList
    .filter((i) => i.extname === '.html')
    .forEach((v) => {
      const content = fs.readFileSync(v.filePath, 'utf-8')

      if ((result = queryReg.exec(content))) {
        const componentPath = path
          .relative('./', path.resolve(v.dirname, v.filename + '.vue'))
          .replace(/\\/g, '/')
          .replace('src/', '@/')
        routes.push({
          component: `_(): Promise<typeof import('*.vue')> => import('${componentPath}')_`,
          meta: {
            keepAlive: true,
            title: result.groups!.tagContent,
          },
          name: `${v.filename}`,
          path: `/${v.filename}`,
        })
      }
    })
  const output = JSON.stringify(routes, null, 2).replace(/(['"]_|_['"])/g, '')
  writeFile('src/query/json/routes.json', output)
} //获取项目中拥有注释属性

export const getAttrsAndAnnotation = (targetPath?: string) => {
  const babelPluginPathList = ['../plugins/babel-plugins/extract-annotation']
  const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
    const result = require(pluginPath)

    if (result.default) {
      return result.default
    }

    return result
  })
  const attrsCollection: AttrsCollection = {
    key: '',
    standingInitial: 'string',
    value: '',
  } //所有属性描述对象

  const attrsCollectionGroup: AttrsCollection[] = [] //根据首字母分类属性描述对象数组

  const handler = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        extra: {
          attributesObj: {},
        },
        path: filePath,
        source: content,
      } //不需要新内容

      runBabelPlugin(execFileInfo, plugins)
      const attributesObj = execFileInfo.extra!.attributesObj as Record<
        string,
        string
      >

      if (Object.keys(attributesObj).length) {
        for (const [key, value] of Object.entries(attributesObj)) {
          //冲突处理
          if (Reflect.get(attrsCollection, key)) {
            const newKey = `${key}:arrow_right:(in ${path.basename(filePath)})`

            if (
              Reflect.get(attrsCollection, newKey) === value ||
              Reflect.get(attrsCollection, key) === value
            ) {
              continue
            }

            Reflect.set(attrsCollection, newKey, value)
            attrsCollectionGroup.push({
              key: newKey,
              standingInitial: newKey.slice(0, 1).toLocaleUpperCase(),
              value,
            })
          } else {
            Reflect.set(attrsCollection, key, value)
            attrsCollectionGroup.push({
              key,
              standingInitial: key.slice(0, 1).toLocaleUpperCase(),
              value,
            })
          }

          Reflect.set(attrsCollection, key, value)
        }
      }
    } catch (e) {
      console.error('目标文件出错：', filePath)
      console.error(e)
    }
  }

  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.extname)
    )
    const { updateBar } = cliProgress.useCliProgress(targetList.length)
    targetList.forEach((item: FileInfo) => {
      handler(item.filePath)
      updateBar()
    })
  }

  const attrsGroup = mdUtils.groupBy(attrsCollectionGroup, 'standingInitial') //根据首字母排序

  const attributesDescriptionTable =
    mdUtils.createdAttributesGroupTable(attrsGroup) //获取项目使用属性描述

  writeFile(
    'src/query/md/attributes-description-table.md',
    attributesDescriptionTable.replace(/\{\{.*\}\}/g, '').replace(/<.*>/g, '')
  )
  const storeTable = mdUtils.createdStoreTable(storeFile, attrsCollection) //获取store属性描述

  writeFile(
    'src/query/md/storeTable.md',
    storeTable.replace(/\{\{.*\}\}/g, '').replace(/<.*>/g, '')
  )
  writeFile(
    'src/query/json/attrs-collection.json',
    JSON.stringify(attrsCollection)
  )
} //获取自定组件Props,Methods,Slot,Event

export const getComponentDescription = () => {
  const writeFilePath = 'src/query/md/component-description.md'
  const fsIntance = new fsUtils(path.join('src/components/common'))
  const filePathList = fsIntance.filePathList.sort((filePath1, filePath2) => {
    return path.basename(filePath1).localeCompare(path.basename(filePath2))
  })
  let str = ''
  filePathList.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    str += `### ${path.relative('./', filePath)}${br}`
    str += mdUtils.parseDocs(content, {
      md: true,
    })
  })

  if (!str.length) {
    return
  }

  writeFile(writeFilePath, str)
} //转化excel内容为json

export function getJsonFromExecl() {
  const list: ExcelPosition[] = [
    {
      load: 'src/query/excel/nav.xlsx',
      save: 'src/query/json/nav.json',
    },
    {
      load: 'src/query/excel/nav-layout.xlsx',
      save: 'src/query/json/nav-layout.json',
    },
    {
      load: 'src/query/excel/smenu.xlsx',
      save: 'src/query/json/smenu.json',
    },
    {
      load: 'src/query/excel/tab.xlsx',
      save: 'src/query/json/tab.json',
    },
  ] //从execl中导入scss变量,和compose-css-variable.js搭配使用合并完整scss变量文件

  const getExcelProps = (list: ExcelPosition[]) => {
    //excel文件列表和转化输出位置
    const excelUtils = require('../../utils/excel')

    const transformMap = new Map([
      ['名称', 'description'],
      ['值(lg)', 'value-lg'],
      ['值(xl)', 'value-xl'],
      ['值', 'value'],
      ['变量名（开发用）', 'name'],
      ['备注', 'remark'],
    ])
    list.forEach((item) => {
      const content = fs.readFileSync(item.load)
      const outdata = excelUtils.importfxx(content, transformMap)
      const formatResult = []

      for (let index = 0; index < outdata.length; index++) {
        const element = outdata[index]

        if (!element.name) {
          continue
        }

        element.value =
          element.value || element['value-lg'] || element['value-xl']
        const mediaQuery = ['-lg', '-xl']

        for (const query of mediaQuery) {
          const name = `${element.name}${query}`
          const value = element[`value${query}`] || element.value
          const temp = { ...element, name, value }
          formatResult.push(temp)
        }
      }

      writeFile(item.save, JSON.stringify(formatResult))
    })
  } //合并scss样式变量,和get-excel-props搭配使用转换excel数据并合并

  const composeCssVariable = (list: ExcelPosition[]) => {
    const compose: Record<string, any> = {}
    list.forEach((item) => {
      const filename = path.basename(item.save, path.extname(item.save))
      compose[filename] = require(item.save)
    })
    let str = ''
    str += ':root {' + br

    for (const [groupName, groupValue] of Object.entries(compose)) {
      str += `//${groupName}${br}`

      for (const item of groupValue) {
        if (!item.name || !item.value || item.name === item.value) {
          continue
        }

        str += `${item.name}:${item.value};${br}`
      }

      str += br
    }

    str += '}'
    writeFile('src/query/css/index.scss', str)
  }

  getExcelProps(list)
  composeCssVariable(list)
} //按照匹配项，批量更改文件名

export const modifyFilename = (isDirectlyExec = true) => {
  const source = require('../query/json/source.json') as SourceItem[]

  const priviewResult = () => {
    //文件信息整合
    const fileInfoList = new fsUtils(
      path.join('src/assets/images/aside-icon')
    ).getFileInfoList() //按创建时间进行排序

    fileInfoList.sort((v1, v2) => {
      return v1.stats.birthtimeMs - v2.stats.birthtimeMs
    }) //查命名错误和遗漏

    const tempList: SourceItem[] = []
    source.forEach((i) => {
      if (!fileInfoList.some((v) => v.filename === i.filename)) {
        tempList.push(i)
      }
    }) //预览

    writeFile('src/query/json/priview.json', JSON.stringify(tempList))
  }

  const modifyFilenameHandle = () => {
    //自定义命名
    const customBaseNameGenerateFunction = (oldFile: string) => {
      const oldFileName = path.basename(oldFile, path.extname(oldFile)) //文件名

      return (
        source.find((item: SourceItem) => item.filename === oldFileName)
          ?.target || oldFileName
      )
    }

    fsInstance.modifyFileName(customBaseNameGenerateFunction)
  }

  if (isDirectlyExec) {
    modifyFilenameHandle()
  } else {
    priviewResult() //先预览下结果
  }
} //根据提供正则查询

export const queryByReg = (
  reg: RegExp,
  isBatch = false,
  appointFilePath?: string
) => {
  const writeFilePath = 'src/query/md/query.md'
  let result = '' //批量查询

  const batchQuery = (regExpression: RegExp) => {
    let str = ''
    fsInstance.filePathList.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8')
      str += mdUtils.queryContentByReg(content, regExpression)
    })
    return str
  } //指定查询

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
} //根据提供正则替换替换内容，直接传入内容，可能链式修改

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
    const matchContent = result[0] //有命名指定用指定，没有就使用默认匹配

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

    localContent = resultLeft + replaceResult + resultRight //移动位置避免替代重复内容

    reg.lastIndex = (resultLeft + replaceResult).length
  }

  return {
    isChange,
    localContent,
  }
}
export type ExecListType = Array<RegExec> //根据正则表达式批量替换文件内容

export const batchReplaceByReg = (
  execList: ExecListType,
  filterCondition?: FilterConditionType
) => {
  let restBasenameList = fileInfoList //批量替换

  if (typeof filterCondition === 'function') {
    restBasenameList = restBasenameList.filter(filterCondition)
  }

  let modifyCount = 0
  restBasenameList.forEach((item) => {
    let content = fs.readFileSync(item.filePath, 'utf-8')
    let isChange = false

    for (const exec of execList) {
      const result = replaceByReg(exec.reg, content, exec.matchContentHandle)

      if (result.isChange) {
        isChange = true
        content = result.content
      }
    }

    if (isChange) {
      writeFile(item.filePath, content)
      modifyCount++
    }
  })
  console.info(`共修改了${modifyCount}次文件`)
} //使用babel插件

export const execBabelPlugin = (
  babelPlugins: BabelPlugin[],
  targetPath?: string
) => {
  if (!babelPlugins.length) {
    return
  }

  const handler = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content,
      }
      const newContent = runBabelPlugin(execFileInfo, babelPlugins)

      if (newContent && newContent.length) {
        writeFile(filePath, newContent)
      }
    } catch (e) {
      console.error('目标文件出错：', filePath)
      console.error(e)
    }
  }

  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.extname)
    )
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
    }
  }
} //使用psthtml插件

export const execPosthtmlPlugin = (
  plugins: PosthtmlPlugin<unknown>[],
  targetPath?: string
) => {
  const handler = async (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content,
      }
      const newContent = await getPosthtmlPluginActuator(execFileInfo, plugins)

      if (newContent && newContent.length) {
        writeFile(filePath, newContent)
      }
    } catch (e) {
      console.error('目标文件出错：', filePath)
      console.error(e)
    }
  }

  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.htm', '.html', '.vue', '.xml']
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.extname)
    )
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
    }
  }
}
export const execCodemod = (codemodList: Transform[], targetPath?: string) => {
  if (!codemodList.length) {
    return
  }

  const handler = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const execFileInfo: ExecFileInfo = {
        path: filePath,
        source: content,
      }
      const newContent = runCodemod(execFileInfo, codemodList)

      if (newContent && newContent.length) {
        writeFile(filePath, newContent)
      }
    } catch (e) {
      console.error('目标文件出错：', filePath)
      console.error(e)
    }
  }

  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.js', '.jsx', '.ts', '.tsx', '.vue']
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.extname)
    )
    const { updateBar } = cliProgress.useCliProgress(targetList.length)

    for (const item of targetList) {
      handler(item.filePath)
      updateBar()
    }
  }
}
