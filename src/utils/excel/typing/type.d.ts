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
export interface otherSheetType {
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
export interface otherObjDeatil {
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
//列出需要的插入函数的选项
// 判断规则，先判断prop--publicMap--options（options：null）则无需进行isAttrs判断--isAttrs（null则忽视下面的其他属性）
export const publicMapList = [
  {
    prop: 'amsSortNum',
    options: 'ams_category',
    publicMap: 'ams_category',
    isAttrs: true,
    disabled: true,
    label: null,
    placeholder: null
  },
  {
    prop: 'keepterm',
    options: 'ams_category',
    publicMap: 'ams_category',
    disabled: false,
    label: '永久',
    isAttrs: true,
    placeholder: '请选择'
  },
  {
    prop: 'secrecy',
    isAttrs: true,
    options: 'ams_secrecy',
    publicMap: 'ams_secrecy',
    disabled: false,
    label: '无',
    placeholder: '请选择'
  },
  {
    prop: 'emergencyLevel',
    isAttrs: false,
    options: 'ams_emergencyLevel',
    publicMap: 'ams_emergencyLevel',
    disabled: false,
    label: '永久',
    placeholder: '请选择'
  },
  {
    prop: 'dataFullTag',
    isAttrs: false,
    options: 'ams_dataFullTag',
    publicMap: 'ams_dataFullTag',
    disabled: false,
    label: '永久',
    placeholder: '请选择'
  },
  {
    prop: 'archivesTag',
    isAttrs: true,
    options: 'ams_archivesTag',
    publicMap: 'ams_archivesTag',
    disabled: true,
    label: '无',
    placeholder: '请选择'
  },
  {
    prop: 'createPdfStatus',
    publicMap: 'catalog_createPdfStatus',
    isAttrs: true,
    options: null,
    disabled: true,
    label: '无',
    placeholder: '请选择'
  },
  {
    prop: 'otherModuleTag',
    publicMap: 'ams_otherModuleTag',
    isAttrs: true,
    options: null,
    disabled: true,
    label: '无',
    placeholder: '请选择'
  },
  {
    prop: 'checkResult',
    publicMap: 'get_checkResult',
    options: null,
    isAttrs: true,
    disabled: true,
    label: '无',
    placeholder: '请选择'
  }
]
