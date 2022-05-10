import * as xlsx from 'xlsx'
import { getValueByKey, getSortTypeName, keyValueMap, fileTypeMap } from './utils/map'
//@ts-ignore
import source from '../../query/json/excelObjectList.json'
import { groupBy } from '../common'
import type { ObjDeatil, SheetType } from './typing/type'

const runJsonToExcel = () => {
  if (!source?.length) {
    throw new Error('runJsonToExcel缺少数据来源')
  }
  const fileTypeList = Array.from(fileTypeMap.keys())
  const localSource = source.filter((item: any) => item.sortTypeValue) as ObjDeatil[]
  localSource.sort((v1, v2) => {
    return fileTypeList.indexOf(v1.resoure) - fileTypeList.indexOf(v2.resoure)
  })
  const sourceGroup = groupBy<ObjDeatil>(localSource, 'sortTypeValue')
  const workbook = xlsx.utils.book_new()
  const header = Object.values(keyValueMap)
  for (const [sortTypeValue, groupItem] of Object.entries(sourceGroup)) {
    const sheetName = getSortTypeName(sortTypeValue)
    if (sheetName) {
      const sheetContent = groupItem.group.map((item) => {
        const cell = {} as SheetType
        for (const [key, value] of Object.entries(item)) {
          const title = getValueByKey(key)
          if (title) {
            //@ts-ignore
            cell[title] = value as unknown
          }
        }
        for (const key of header) {
          switch (key) {
            case '是否必填':
              cell[key] = cell[key] ? 'Y' : 'N'
              break
            case '是否显示':
              cell[key] = cell[key] ? 'Y' : 'N'
              break
            case '是否增改':
              cell[key] = cell[key] ? 'Y' : 'N'
              break
          }
        }
        return cell
      })
      const worksheet = xlsx.utils.json_to_sheet(sheetContent, { cellStyles: true, header })
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName, true)
    }
  }

  xlsx.writeFileXLSX(workbook, './dist/src/query/excel/test.xlsx', {
    cellStyles: true
  })
}
export default runJsonToExcel
