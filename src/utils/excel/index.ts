module.exports = {
  importfxx(file, transformMap) {
    // 通过DOM取文件数据
    let wb // 读取完成的数据
    let outdata
    const XLSX = require('xlsx')
    wb = XLSX.read(file, {
      type: 'buffer'
    })
    outdata = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) // outdata就是你想要的东西
    const arr = []
    outdata.map((item) => {
      const obj = {}
      let key, value
      for (const name in item) {
        if (Object.hasOwnProperty.call(item, name)) {
          key = transformMap.get(name)
          value = item[name]
          obj[key] = value
        }
      }
      arr.push(obj)
    })
    return arr
  },
  // 导出报表
  exportExcel(res) {
    require.ensure([], () => {
      const { export_json_to_excel } = require('./export-to-excel.js')
      const tHeader = ['姓名']
      const filterVal = ['name']
      const list = res
      const data = this.formatJson(filterVal, list)
      export_json_to_excel(tHeader, data, '测试excel')
    })
  },
  formatJson(filterVal, jsonData) {
    return jsonData.map((v) => filterVal.map((j) => v[j]))
  }
}
