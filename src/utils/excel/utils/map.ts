import type { SheetType, FileTypeMap } from '../typing/type'

/**
 * excel表格属性于名称对应字段，固定顺序，不要变更
 */
export const keyValueMap: Record<string, keyof SheetType> = {
  label: '门类字段',
  prop: '后端字段',
  required: '是否必填',
  Tshow: '是否显示',
  Fshow: '是否增改',
  remark: '核对备注',
  type: '数据类型',
  rowShow: '前端行数',
  captureShape: '捕获形式',
  resoure: '所属',
  refDocument: '参考文档'
}

export const getKeyByValue = (target: keyof SheetType) => {
  for (const [key, value] of Object.entries(keyValueMap)) {
    if (value === target) {
      return key
    }
  }
  return ''
}
export const getValueByKey = (target: string) => {
  for (const [key, value] of Object.entries(keyValueMap)) {
    if (key === target) {
      return value
    }
  }
  return ''
}

/**
 * 档案类型映射表，固定顺序，不要变更
 */
export const sortTypeMap = new Map([
  ['103', '文书档案'],
  ['104', '合同档案'],
  ['105', '项目档案'],
  ['106', '生产档案'],
  ['107', '人事档案'],
  ['108', '会计凭证'],
  ['109', '会计账簿'],
  ['110', '会计报告'],
  ['111', '其他会计档案'],
  ['112', '照片档案'],
  ['113', '录音档案'],
  ['114', '岩心档案'],
  ['116', '其他档案'],
  ['117', '录像档案'],
  ['118', '全宗档案'],
  ['119', '实物档案'],
  ['120', '设备档案']
])
//返回当前选中分类的名字
export function getSortTypeName(sortType: string, isReverse = false) {
  if (isReverse) {
    const newArr = Array.from(sortTypeMap).map((item) => item.reverse()) as Iterable<
      readonly [string, string]
    >
    const reverseMap = new Map(newArr)
    return reverseMap.get(sortType) || 'common'
  }

  return sortTypeMap.get(sortType) || '通用档案'
}

/**
 * 档案级别映射表，固定顺序，不要变更
 */
export const fileTypeMap = new Map<FileTypeMap['fileTypeLabel'], FileTypeMap['fileTypeValue']>([
  ['案卷目录级', 'tome'],
  ['卷内目录级', 'tomeCatalog'],
  ['文件目录级', 'catalog'],
  ['文件内容级', 'annex']
])
export function getFileType(value: FileTypeMap['fileTypeLabel']) {
  return fileTypeMap.get(value)
}
