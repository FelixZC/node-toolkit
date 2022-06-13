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
