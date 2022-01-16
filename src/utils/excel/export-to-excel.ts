/* eslint-disable */
require('script-loader!file-saver')

require('script-loader!./blob')

require('script-loader!xlsx/dist/xlsx.core.min')

function generateArray(table) {
  const out = []
  const rows = table.querySelectorAll('tr')
  const ranges = []

  for (var R = 0; R < rows.length; ++R) {
    var outRow = []
    const row = rows[R]
    const columns = row.querySelectorAll('td')

    for (let C = 0; C < columns.length; ++C) {
      const cell = columns[C]
      let colspan = cell.getAttribute('colspan')
      let rowspan = cell.getAttribute('rowspan')
      let cellValue = cell.innerText
      if (cellValue !== '' && cellValue == +cellValue) cellValue = +cellValue //Skip ranges

      ranges.forEach((range) => {
        if (
          R >= range.s.r &&
          R <= range.e.r &&
          outRow.length >= range.s.c &&
          outRow.length <= range.e.c
        ) {
          for (let i = 0; i <= range.e.c - range.s.c; ++i) outRow.push(null)
        }
      }) //Handle Row Span

      if (rowspan || colspan) {
        rowspan = rowspan || 1
        colspan = colspan || 1
        ranges.push({
          e: {
            c: outRow.length + colspan - 1,
            r: R + rowspan - 1,
          },
          s: {
            c: outRow.length,
            r: R,
          },
        })
      } //Handle Value

      outRow.push(cellValue !== '' ? cellValue : null) //Handle Colspan

      if (colspan) for (let k = 0; k < colspan - 1; ++k) outRow.push(null)
    }

    out.push(outRow)
  }

  return [out, ranges]
}

function datenum(v, date1904) {
  let localV = v
  if (date1904) localV += 1462
  const epoch = Date.parse(localV)
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000)
}

function sheet_from_array_of_arrays(data, opts) {
  const ws = {}
  const range = {
    e: {
      c: 0,
      r: 0,
    },
    s: {
      c: 10000000,
      r: 10000000,
    },
  }

  for (let R = 0; R != data.length; ++R) {
    for (let C = 0; C != data[R].length; ++C) {
      if (range.s.r > R) range.s.r = R
      if (range.s.c > C) range.s.c = C
      if (range.e.r < R) range.e.r = R
      if (range.e.c < C) range.e.c = C
      const cell = {
        v: data[R][C],
      }
      if (cell.v == null) continue
      const cell_ref = XLSX.utils.encode_cell({
        c: C,
        r: R,
      })
      if (typeof cell.v === 'number') cell.t = 'n'
      else if (typeof cell.v === 'boolean') cell.t = 'b'
      else if (cell.v instanceof Date) {
        cell.t = 'n'
        cell.z = XLSX.SSF._table[14]
        cell.v = datenum(cell.v)
      } else cell.t = 's'
      ws[cell_ref] = cell
    }
  }

  if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range)
  return ws
}

function Workbook() {
  if (!(this instanceof Workbook)) return new Workbook()
  this.SheetNames = []
  this.Sheets = {}
}

function s2ab(s) {
  const buf = new ArrayBuffer(s.length)
  const view = new Uint8Array(buf)

  for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff

  return buf
}

export function export_table_to_excel(id) {
  const theTable = document.getElementById(id)
  const oo = generateArray(theTable)
  const ranges = oo[1]
  /* original data */

  const data = oo[0]
  const ws_name = 'SheetJS'
  const wb = new Workbook()
  const ws = sheet_from_array_of_arrays(data)
  /* add ranges to worksheet */
  // ws['!cols'] = ['apple', 'banan'];

  ws['!merges'] = ranges
  /* add worksheet to workbook */

  wb.SheetNames.push(ws_name)
  wb.Sheets[ws_name] = ws
  const wbout = XLSX.write(wb, {
    bookSST: false,
    bookType: 'xlsx',
    type: 'binary',
  })
  saveAs(
    new Blob([s2ab(wbout)], {
      type: 'application/octet-stream',
    }),
    'test.xlsx'
  )
}

function formatJson(jsonData) {}

export function export_json_to_excel(th, jsonData, defaultTitle) {
  /* original data */
  const data = jsonData
  data.unshift(th)
  const ws_name = 'SheetJS'
  const wb = new Workbook()
  const ws = sheet_from_array_of_arrays(data)
  /* add worksheet to workbook */

  wb.SheetNames.push(ws_name)
  wb.Sheets[ws_name] = ws
  const wbout = XLSX.write(wb, {
    bookSST: false,
    bookType: 'xlsx',
    type: 'binary',
  })
  const title = defaultTitle || '列表'
  saveAs(
    new Blob([s2ab(wbout)], {
      type: 'application/octet-stream',
    }),
    title + '.xlsx'
  )
}
