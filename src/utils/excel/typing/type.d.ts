import exp from 'constants'
import { type } from 'os'
export type FileTypeValue = 'tome' | 'tomeCatalog' | 'catalog' | 'annex'
export type FileTypeLabel = '案卷目录级' | '卷内目录级' | '文件目录级' | '文件内容级'
export interface SheetType {
  门类字段: string
  后端字段: string
  是否必填: 'Y' | 'N'
  是否显示: 'Y' | 'N'
  是否增改: 'Y' | 'N'
  数据类型:
    | 'input'
    | 'number'
    | 'autocomplete'
    | 'textarea'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'date'
    | 'time'
    | 'switch'
    | 'component'
    | 'selection'
    | 'index'
  捕获形式: string
  前端行数: number
  所属: FileTypeLabel
  参考文档: string
  核对备注: any
}
export interface OtherSheetType {
  字段名称: string
  后端字段: string
  后端数据类型: string
  是否必填: string
  前端输入类型:
    | 'input'
    | 'number'
    | 'autocomplete'
    | 'textarea'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'date'
    | 'time'
    | 'switch'
    | 'component'
    | 'selection'
    | 'index'
  是否置灰: string
  窗口显示长度: number
  是否增改: string
  捕获形式: string
  所属位置: string
}
export interface OutputObj {
  fileType: FileTypeValue
  outputPath: string
}
export interface ObjDeatil {
  label: string
  index: number
  prop: string
  rowShow: number | null
  Fshow: boolean
  Tshow: boolean
  required: boolean
  remark: string
  captureShape: string
  resoure: FileTypeLabel
  refDocument?: string
  fileType: FileTypeValue
  sortTypeValue: string
  sortTypeLabel: string
  type:
    | 'input'
    | 'number'
    | 'autocomplete'
    | 'textarea'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'date'
    | 'time'
    | 'switch'
    | 'component'
    | 'selection'
    | 'index'
}
export interface OtherObjDeatil {
  label?: string
  index?: number
  prop?: string
  rowShow?: number | null
  Fshow?: boolean
  Tshow?: boolean
  required?: boolean
  remark?: string
  captureShape?: string
  resoure?: FileTypeLabel
  refDocument?: string
  fileType?: FileTypeValue
  sortTypeValue?: string
  sortTypeLabel?: string
  publicMap?: string
  disabled?: boolean
  showOverflowTooltip?: boolean
  attrs?: object
  type:
    | 'input'
    | 'number'
    | 'autocomplete'
    | 'textarea'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'date'
    | 'time'
    | 'switch'
    | 'component'
    | 'selection'
    | 'index'
}
export interface ClassifyResult {
  tomeList: (ObjDeatil | Partial<ObjDeatil>)[]
  catalogList: (ObjDeatil | Partial<ObjDeatil>)[]
  annexList: (ObjDeatil | Partial<ObjDeatil>)[]
  tomeCatalogList: (ObjDeatil | Partial<ObjDeatil>)[]
}
