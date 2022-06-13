import * as path from 'path'
import * as xlsx from 'xlsx'
import { writeFile } from '../common'
import { Visitor } from '@babel/core'
import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import generator from '@babel/generator'
import type { NodePath } from '@babel/core'
import { publicMapList } from './typing/mapList'
import type { OtherObjDeatil, OtherSheetType } from './typing/type'
const filePath = './output/json-list.js'
/**
 * 这里需要自己去完善，比如需要几个表,并创建表
 * */
const tableName = [
  { value: '移交事务（上表）', name: 'upList' },
  { value: '移交文件（下表）', name: 'downList' }
]
const listDate: any = {
  upList: [],
  downList: []
}

const upType = '移交事务（上表）'
const downType = '移交文件（下表）'

/*处理数据

**/
function setData(jsonData: OtherSheetType[]) {
  const selectionObjectExpress: OtherObjDeatil = {
    Fshow: false,
    index: 0,
    Tshow: true,
    type: 'selection'
  }
  const indexObjectExpress: OtherObjDeatil = {
    Fshow: false,
    index: 1,
    label: '序号',
    Tshow: true,
    type: 'index'
  }
  listDate.upList = [selectionObjectExpress, indexObjectExpress]
  listDate.downList = [selectionObjectExpress, indexObjectExpress]

  jsonData.forEach((v, index) => {
    if (v['字段名称'] !== '序号') {
      let obj: OtherObjDeatil = {
        label: v['字段名称'] || '',
        prop: v['后端字段'] || '',
        Fshow: v['是否增改'] === 'true',
        Tshow: true,
        type: v['前端输入类型'] || 'input',
        remark: v['捕获形式'] || '',
        rowShow: v['窗口显示长度'] || 1,
        disabled: v['是否置灰'] === '是',
        showOverflowTooltip: true,
        publicMap: ''
      }
      const needPubliceMapObj = publicMapList.filter((i) => v['字段名称'].includes(i.prop))
      needPubliceMapObj.length > 0 ? (obj.publicMap = needPubliceMapObj[0].publicMap) : ''
      if (needPubliceMapObj[0]?.options && needPubliceMapObj[0].isAttrs) {
        obj.attrs = {
          disabled: needPubliceMapObj[0].disabled,
          label: needPubliceMapObj[0].label,
          placeholder: needPubliceMapObj[0].placeholder
        }
      }
      switch (v['所属位置']) {
        case upType:
          listDate.upList?.push(obj)
          break
        case downType:
          listDate.downList?.push(obj)
          break
        default:
          break
      }
    }
  })
  for (const key in listDate) {
    listDate[key] = publicOptions(JSON.stringify(listDate[key])).code
  }

  tableName.forEach((v) => {
    const sourcePath = path.format({
      base: `./output/${v.name}.js`,
      dir: __dirname
    })
    writeFile(sourcePath, listDate[v.name])
  })
}

function publicOptions(code: string) {
  const teserveTest = (path: NodePath<t.StringLiteral>) => {
    path.parentPath.insertBefore(
      t.objectProperty(
        t.identifier('formatter'),
        t.memberExpression(t.identifier('PublicFormatter'), t.identifier('dateFormat'))
      )
    )
  }
  const isNeedOptions = (value: string) => {
    return publicMapList.filter((i) => value.includes(i.prop)).length > 0
  }
  const getOptions = (value: string) => {
    return publicMapList.filter((i) => value.includes(i.prop))[0]
  }
  const setOption = (path: NodePath<t.StringLiteral>, options: string) => {
    path.parentPath.insertBefore(
      t.objectProperty(
        t.identifier('options'),
        t.memberExpression(t.identifier('PublicMap'), t.identifier(options))
      )
    )
  }
  // 将代码转抽象语法树
  const ast = parser.parse(code)
  const visitor: Visitor = {
    StringLiteral(path: NodePath<t.StringLiteral>) {
      const parentPath = path.parentPath.node
      if (
        path.node.value === 'type' &&
        parentPath.type === 'ObjectProperty' &&
        parentPath.value.type === 'StringLiteral' &&
        parentPath.value.value === 'date'
      ) {
        teserveTest(path)
      }

      if (
        path.node.value === 'prop' &&
        parentPath.type === 'ObjectProperty' &&
        parentPath.value.type === 'StringLiteral' &&
        isNeedOptions(parentPath.value.value)
      ) {
        const obj = getOptions(parentPath.value.value)
        if (obj.options) {
          setOption(path, obj.options)
        }
      }
    }
  }
  // traverse 转换代码
  traverse(ast, visitor)
  // 3. generator 将 AST 转回成代码
  return generator(ast, {}, code)
}

function runOtherExcelToJson() {
  const sourcePath = path.format({
    base: './员工移交.xlsx',
    dir: __dirname
  })
  const workBook = xlsx.readFile(sourcePath, {
    cellFormula: true,
    cellHTML: true,
    cellStyles: true,
    cellText: true
  })
  const SheetNames = workBook.SheetNames //获取表名
  const worksheet = workBook.Sheets[SheetNames[0]] //默认只有一张表
  const jsonData = xlsx.utils.sheet_to_json<OtherSheetType>(worksheet)
  setData(jsonData)
  writeFile(filePath, JSON.stringify(jsonData))
}
runOtherExcelToJson()
