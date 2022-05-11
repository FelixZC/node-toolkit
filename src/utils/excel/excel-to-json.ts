import { fileTypeMap, getFileType, getSortTypeName } from './utils/map'
import { writeFile } from '../common'
import * as path from 'path'
import * as xlsx from 'xlsx'
import type { ClassifyResult, OutputObj, SheetType } from './typing/type'
import type { FileTypeValue, ObjDeatil } from './typing/type'
/**
 * 默认初始值，导入导出时作类型校验用
 */

export const defaultObjDeatil: ObjDeatil = {
  label: '默认值',
  prop: '',
  Fshow: false,
  Tshow: false,
  type: 'input',
  required: false,
  remark: '存在不符合约定单元格',
  captureShape: '',
  resoure: '案卷目录级',
  refDocument: '',
  rowShow: 1,
  fileType: 'tome',
  index: 0,
  sortTypeValue: '',
  sortTypeLabel: ''
}
/**
 * 处理表数据，根据表类型进行分类
 * @param jsonData
 * @returns
 */

function classifyData(jsonData: SheetType[], sheetname: string) {
  const sortType = getSortTypeName(sheetname, true)
  const selectionObjectExpress: Partial<ObjDeatil> = {
    Fshow: false,
    index: 0,
    Tshow: true,
    type: 'selection'
  }
  const indexObjectExpress: Partial<ObjDeatil> = {
    Fshow: false,
    index: 1,
    label: '序号',
    Tshow: true,
    type: 'index'
  }
  const classifyResult: ClassifyResult = {
    annexList: [selectionObjectExpress, indexObjectExpress],
    catalogList: [selectionObjectExpress, indexObjectExpress],
    tomeCatalogList: [selectionObjectExpress, indexObjectExpress],
    tomeList: [selectionObjectExpress, indexObjectExpress]
  }
  jsonData.forEach((item, index) => {
    // 先判断是那个表格的-并且是否显示（Tshow）为yes 或者是否增改（Fshow）未yes
    const fileType = getFileType(item['所属']) as FileTypeValue
    const classifyResultKey = `${fileType}List` as keyof typeof classifyResult

    if (fileType) {
      const sample: ObjDeatil = {
        label: item['门类字段'],
        prop: item['后端字段'],
        Fshow: item['是否增改'] === 'Y',
        Tshow: item['是否显示'] === 'Y',
        type: item['数据类型'],
        required: item['是否必填'] === 'Y',
        remark: item['核对备注'],
        captureShape: item['捕获形式'],
        resoure: item['所属'],
        refDocument: item['参考文档'],
        rowShow: Number(item['前端行数']),
        fileType,
        index: classifyResult[classifyResultKey].length,
        sortTypeValue: sortType,
        sortTypeLabel: sheetname
      }
      classifyResult[classifyResultKey].push(sample)
    } else {
      classifyResult[classifyResultKey].push(defaultObjDeatil)
    }
  })
  return classifyResult
}
/**
 * 转化表格，输出转化结果
 */

export default function runExcelToJson() {
  const sourcePath = path.format({
    base: './珠三角档案类别字段.xlsx',
    dir: __dirname
  })
  const workBook = xlsx.readFile(sourcePath, {
    cellFormula: true,
    cellHTML: true,
    cellStyles: true,
    cellText: true
  })
  const SheetNames = workBook.SheetNames //获取表名

  const fileTypeList = Array.from(fileTypeMap.values())
  const outputMap: OutputObj[] = fileTypeList.map((fileType) => {
    const filePath = `./output/${fileType}-form.js`
    return {
      fileType,
      outputPath: path.format({
        base: filePath,
        dir: __dirname
      })
    }
  })
  const cache = {
    annexResult: '',
    catalogResult: '',
    tomeCatalogResult: '',
    tomeResult: ''
  }
  SheetNames.forEach((sheetname: string) => {
    const sortType = getSortTypeName(sheetname, true)
    const worksheet = workBook.Sheets[sheetname]
    const jsonData = xlsx.utils.sheet_to_json<SheetType>(worksheet)
    const classifyResult = classifyData(jsonData, sheetname)
    console.log(sortType, sheetname)

    for (const fileType of fileTypeList) {
      const cacheKey = `${fileType}Result` as keyof typeof cache
      const classifyResultKey = `${fileType}List` as keyof ClassifyResult
      const form = classifyResult[classifyResultKey]

      if (form.length > 2) {
        cache[cacheKey] += `
            case '${sortType}':
              form = ${JSON.stringify(form)}
              break
            `
      }
    }
  })

  for (const outputItem of outputMap) {
    const fileType = outputItem.fileType
    const functionName = `${fileType}Form`
    const cacheKey = `${fileType}Result` as keyof typeof cache
    const result = cache[cacheKey]
    const outputPath = outputItem.outputPath
    let outputContent = `
       module.exports =  function ${functionName}(sortType='common'){
            let form=[]
            switch (sortType){
                 ${result}
            }
            return form
        }
            `
    outputContent = outputContent.replace(`case 'common':`, 'default:')
    writeFile(outputPath, outputContent)
  }
}