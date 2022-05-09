import * as xlsx from 'xlsx'
import { getValueByKey, getSortTypeName, getTypeMap, keyValueMap } from './utils/map'
//@ts-ignore
import source from '../../query/json/excelObjectList.json'
import { groupBy } from '../common'
import type { ObjDeatil, SheetType } from './typing/type'

const runJsonToExcel = () => {
  const sourceGroup = groupBy<ObjDeatil>(source, 'sortTypeValue')
  const sourceGroupTemp = {} as typeof sourceGroup
  // 已经排序完毕，懒得再排序了
  for (const groupKey of Object.keys(sourceGroup).reverse()) {
    sourceGroupTemp[groupKey] = sourceGroup[groupKey]
  }
  const workbook = xlsx.utils.book_new()
  const header = Object.values(keyValueMap)
  for (const [sortTypeValue, groupItem] of Object.entries(sourceGroupTemp)) {
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
            case '数据类型':
              cell[key] = getTypeMap(cell[key])
              break
          }
        }
        return cell
      })
      const worksheet = xlsx.utils.json_to_sheet(sheetContent, { cellStyles: true, header })
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName, true)
    }
  }

  xlsx.writeFileXLSX(workbook, './src/query/excel/test.xlsx', {
    cellStyles: true
  })
}
export default runJsonToExcel
