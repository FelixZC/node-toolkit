import babel from '@babel/core'
import runBabelPlugin from '../plugins/useBabelPlugin'
import getPostcssPluginActuator from 'src/plugins/usePostcssPlugin'
import getPosthtmlPluginActuator from 'src/plugins/usePosthtmlPlugin'
import * as fs from 'fs'
import * as path from 'path'
import mdUtils, { GroupCache } from '../utils/md'
import fsUtils from '../utils/fs'
import type { FileInfo } from '../utils/fs'
import * as os from 'os'
import { ExecFileInfo } from '../plugins/common'
import type { Plugin as PosthtmlPlugin } from 'posthtml'
import type { BabelPlugin } from '../plugins/useBabelPlugin'
import type { AcceptedPlugin as PostcssPlugin } from 'postcss'
import runCodemod from '../plugins/useJsCodemod'
import type { Transform } from 'jscodeshift'
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
}
//文件分类
export const classifyFilesGroup = (isQueryRepeat = false) => {
  //查询命名重复
  const classifyRepeatFileGroup = () => {
    let group = mdUtils.groupBy(fileInfoList, 'basename') //按文件名分类
    const filesGroupOfRepeat = Object.values(group).filter(
      (item: GroupCache) => item.group.length > 1
    ) //过滤重复命名数组
    group = mdUtils.groupBy(filesGroupOfRepeat, 'extname') //再按文件类型分类
    fs.writeFileSync(
      './node/query/json/files-group-repeat.json',
      JSON.stringify(group, null, 2)
    )
  }

  //查询同一类型文件
  const classifyNormalFilesGroup = () => {
    const group = mdUtils.groupBy(fileInfoList, 'extname') //按文件类型分类
    fs.writeFileSync(
      './node/query/json/files-group.json',
      JSON.stringify(group, null, 2)
    )
  }
  if (isQueryRepeat) {
    classifyRepeatFileGroup()
  } else {
    classifyNormalFilesGroup()
  }
}

//文本转化并格式
export const formatText = () => {
  const loadAndSaveList = [
    {
      mode: 'md', //md文件去重
      sourceFilePath: './node/query/md/query.md',
      targetFilePath: './node/query/md/query.md',
    },
    {
      mode: 'txtToTxt', //每日n句去重
      sourceFilePath: './node/query/txt/每日n句.txt',
      targetFilePath: './node/query/txt/每日n句.txt',
    },
    {
      mode: 'txtToMd', //每日n句转md
      sourceFilePath: './node/query/txt/每日n句.txt',
      targetFilePath: './node/query/md/sentence.md',
    },
  ]
  for (const item of loadAndSaveList) {
    const fileContent = fs.readFileSync(item.sourceFilePath, 'utf-8')
    const str = mdUtils.textFormat(fileContent, item.mode)
    fs.writeFileSync(item.targetFilePath, str)
  }
}

//路由生成
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
          path: `/${v.filename}`,
          name: `${v.filename}`,
          component: `_(): Promise<typeof import('*.vue')> => import('${componentPath}')_`,
          meta: { title: result.groups!.tagContent, keepAlive: true },
        })
      }
    })
  const output = JSON.stringify(routes, null, 2).replace(/(['"]_|_['"])/g, '')
  fs.writeFileSync('./node/query/json/routes.json', output)
}

//获取项目中拥有注释属性
export const getAttrsAndAnnotation = (targetPath?: string) => {
  const storeFile = require('../js/stote-state')
  const babelPluginPathList = ['../../babel-plugins/extract-annotation']
  const plugins: BabelPlugin[] = babelPluginPathList.map((pluginPath) => {
    const result = require(pluginPath)
    if (result.default) {
      return result.default(babel)
    }
    return result(babel)
  })
  const transform = runBabelPlugin(plugins)
  const AttrsCollection = {} as AttrsCollection //所有属性描述对象
  const attrsCollectionGroup: AttrsCollection[] = [] //根据首字母分类属性描述对象数组
  if (!transform) {
    return
  }
  //获取注释描述对象
  const handler = (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const execFileInfo: ExecFileInfo = {
      path: filePath,
      source: content,
      extra: { attributesObj: {} as Record<string, any> },
    }
    //不需要新内容
    transform(execFileInfo)
    if (
      execFileInfo.extra &&
      Object.keys(execFileInfo.extra.attributesObj).length
    ) {
      for (const [key, value] of Object.entries(
        execFileInfo.extra.attributesObj
      )) {
        //冲突处理
        if (Reflect.get(AttrsCollection, key)) {
          const newKey = key + `:arrow_right:(in ${path.basename(filePath)})`
          if (
            Reflect.get(AttrsCollection, newKey) === value ||
            Reflect.get(AttrsCollection, key) === value
          ) {
            continue
          }
          Reflect.set(AttrsCollection, newKey, value)
          attrsCollectionGroup.push({
            standingInitial: newKey.slice(0, 1).toLocaleUpperCase(),
            key: newKey,
            value,
          })
        } else {
          Reflect.set(AttrsCollection, key, value)
          attrsCollectionGroup.push({
            standingInitial: key.slice(0, 1).toLocaleUpperCase(),
            key,
            value,
          })
        }
        Reflect.set(AttrsCollection, key, value)
      }
    }
  }
  if (targetPath) {
    handler(targetPath)
  } else {
    fileInfoList.forEach((item: FileInfo) => {
      handler(item.filePath)
    })
  }

  const attrsGroup = mdUtils.groupBy(attrsCollectionGroup, 'standingInitial') //根据首字母排序
  const attributesDescriptionTable =
    mdUtils.createdAttributesGroupTable(attrsGroup) //获取项目使用属性描述
  fs.writeFileSync(
    './node/query/md/attributes-description-table.md',
    attributesDescriptionTable,
    {
      encoding: 'utf-8',
    }
  )

  const storeTable = mdUtils.createdStoreTable(storeFile, AttrsCollection) //获取store属性描述
  fs.writeFileSync('./node/query/md/storeTable.md', storeTable, {
    encoding: 'utf-8',
  })
  fs.writeFileSync(
    './node/query/json/attrs-collection.json',
    JSON.stringify(AttrsCollection),
    {
      encoding: 'utf-8',
    }
  )
}

//获取自定组件Props,Methods,Slot,Event
export const getComponentDescription = () => {
  const writeFilePath = './node/query/md/component-description.md'
  const filePathList = new fsUtils(
    path.join('src/components/common')
  ).filePathList.sort((filePath1, filePath2) => {
    return path.basename(filePath1).localeCompare(path.basename(filePath2))
  })
  let str = ''
  filePathList.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    str += `### ${path.relative('./', filePath)}` + br
    str += mdUtils.parseDocs(content, { md: true })
  })
  if (!str.length) {
    return
  }
  fs.writeFileSync(writeFilePath, str, { encoding: 'utf-8' })
}

//转化excel内容为json
export function getJsonFromExecl() {
  const list: ExcelPosition[] = [
    {
      load: './node/query/excel/nav.xlsx',
      save: './node/query/json/nav.json',
    },
    {
      load: './node/query/excel/nav-layout.xlsx',
      save: './node/query/json/nav-layout.json',
    },
    {
      load: './node/query/excel/smenu.xlsx',
      save: './node/query/json/smenu.json',
    },
    {
      load: './node/query/excel/tab.xlsx',
      save: './node/query/json/tab.json',
    },
  ]
  //从execl中导入scss变量,和compose-css-variable.js搭配使用合并完整scss变量文件
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
          const temp = { ...element, value, name }
          formatResult.push(temp)
        }
      }
      fs.writeFileSync(item.save, JSON.stringify(formatResult))
    })
  }

  //合并scss样式变量,和get-excel-props搭配使用转换excel数据并合并
  const composeCssVariable = (list: ExcelPosition[]) => {
    const compose: Record<string, any> = {}
    list.forEach((item) => {
      const filename = path.basename(item.save, path.extname(item.save))
      compose[filename] = require(item.save)
    })
    let str = ''
    str += ':root {' + br
    for (const [groupName, groupValue] of Object.entries(compose)) {
      str += `//${groupName}` + br
      for (const item of groupValue) {
        if (!item.name || !item.value || item.name === item.value) {
          continue
        }
        str += `${item.name}:${item.value};` + br
      }
      str += br
    }
    str += '}'
    fs.writeFileSync('./node/query/css/index.scss', str)
  }
  getExcelProps(list)
  composeCssVariable(list)
}

//按照匹配项，批量更改文件名
export const modifyFilename = (isDirectlyExec = true) => {
  const source = require('../json/source.json') as SourceItem[]
  const priviewResult = () => {
    //文件信息整合
    const fileInfoList = new fsUtils(
      path.join('src/assets/images/aside-icon')
    ).getFileInfoList()
    //按创建时间进行排序
    fileInfoList.sort((v1, v2) => {
      return v1.stats.birthtimeMs - v2.stats.birthtimeMs
    })
    //查命名错误和遗漏
    const tempList: SourceItem[] = []
    source.forEach((i) => {
      if (!fileInfoList.some((v) => v.filename === i.filename)) {
        tempList.push(i)
      }
    })
    //预览
    fs.writeFileSync('./node/query/json/priview.json', JSON.stringify(tempList))
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
}

//根据提供正则查询
export const queryByReg = (
  reg: RegExp,
  isBatch = false,
  appointFilePath?: string
) => {
  const writeFilePath = './node/query/md/query.md'
  let result = ''
  //批量查询
  const batchQuery = (regExpression: RegExp) => {
    let str = ''
    fsInstance.filePathList.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8')
      str += mdUtils.queryContentByReg(content, regExpression)
    })
    return str
  }
  //指定查询
  const pageQuery = (regExpression: RegExp) => {
    const readFilePath = appointFilePath || './node/query/md/query.md'
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
  fs.writeFileSync(writeFilePath, result, { encoding: 'utf-8' })
}

//根据提供正则替换替换内容，直接传入内容，可能链式修改
export const replaceByReg = (
  reg: RegExp,
  content: string,
  matchContentHandle: (content: string) => string
) => {
  if (!reg.global) {
    throw new Error('正则必须使用全局匹配模式')
  }
  let result,
    isChange = false
  while ((result = reg.exec(content))) {
    const matchContent = result[0] //有命名指定用指定，没有就使用默认匹配
    const leftIndex = result.index
    const rightIndex = leftIndex + matchContent.length
    const resultLeft = content.slice(0, leftIndex)
    const resultRight = content.slice(rightIndex)
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
    content = resultLeft + replaceResult + resultRight
    //移动位置避免替代重复内容
    reg.lastIndex = (resultLeft + replaceResult).length
  }
  return { content, isChange }
}

export type ExecListType = Array<RegExec>
//根据正则表达式批量替换文件内容
export const batchReplaceByReg = (
  execList: ExecListType,
  filterCondition?: FilterConditionType
) => {
  let restBasenameList = fileInfoList
  //批量替换
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
      fs.writeFileSync(item.filePath, content, { encoding: 'utf-8' })
      modifyCount++
    }
  })
  console.info(`共修改了${modifyCount}次文件`)
}

//使用babel插件
export const execBabelPlugin = (
  babelPlugins: BabelPlugin[],
  targetPath?: string
) => {
  if (!babelPlugins.length) {
    return
  }
  const handler = (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const execFileInfo: ExecFileInfo = {
      path: filePath,
      source: content,
    }
    const newContent = runBabelPlugin(execFileInfo, babelPlugins)
    if (newContent && newContent.length) {
      fs.writeFileSync(filePath, newContent, 'utf-8')
    }
  }
  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.js', '.ts', '.jsx', '.tsx', '.vue']
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.extname)
    )
    for (const item of targetList) {
      handler(item.filePath)
    }
  }
}

//使用psthtml插件
export const execPosthtmlPlugin = (
  plugins: PosthtmlPlugin<unknown>[],
  targetPath?: string
) => {
  const handler = async (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const execFileInfo: ExecFileInfo = {
      path: filePath,
      source: content,
    }
    const newContent = await getPosthtmlPluginActuator(execFileInfo, plugins)
    if (newContent && newContent.length) {
      fs.writeFileSync(filePath, newContent)
    }
  }
  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.html', '.vue', '.htm', '.xml']
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.extname)
    )
    for (const item of targetList) {
      handler(item.filePath)
    }
  }
}

//使用babel插件
export const execCodemod = (codemodList: Transform[], targetPath?: string) => {
  if (!codemodList.length) {
    return
  }
  const handler = (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const execFileInfo: ExecFileInfo = {
      path: filePath,
      source: content,
    }
    const newContent = runCodemod(execFileInfo, codemodList)
    if (newContent && newContent.length) {
      fs.writeFileSync(filePath, newContent, 'utf-8')
    }
  }
  if (targetPath) {
    handler(targetPath)
  } else {
    const vaildList = ['.js', '.ts', '.jsx', '.tsx', '.vue']
    const targetList = fileInfoList.filter((fileInfo) =>
      vaildList.includes(fileInfo.extname)
    )
    for (const item of targetList) {
      handler(item.filePath)
    }
  }
}
