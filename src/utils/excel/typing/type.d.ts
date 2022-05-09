export interface FileTypeMap {
  fileTypeValue: 'tome' | 'catalog' | 'annex' | 'tomeCatalog'
  fileTypeLabel: '案卷目录级' | '文件目录级' | '文件内容级' | '卷内目录级'
}
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
  所属: FileTypeMap['fileTypeLabel']
  参考文档: string
  核对备注: any
}
export interface OutputObj {
  fileType: FileTypeMap['fileTypeValue']
  outputPath: string
}

export interface ObjDeatil {
  label: string
  index?: number
  prop: string
  rowShow: number | null
  Fshow: boolean
  Tshow: boolean
  required: boolean
  remark?: string
  captureShape?: string
  resoure?: string
  refDocument?: string
  resoure?: string
  fileType?: string
  sortTypeValue?: string
  sortTypeLabel?: string
  type?:
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
