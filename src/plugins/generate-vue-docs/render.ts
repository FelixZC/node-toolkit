/**
 * 构建成Markdown
 */
import type { ComponentInfo, MdOption, MdOptions } from './index'
interface RenderMdType {
  parserResult: ComponentInfo
  options: MdOptions
  render: any
  propsRender: any
  slotsRender: any
  eventsRender: any
  methodsRender: any
  renderTabelHeader: any
  renderTabelRow: any
  renderTitle: any
  _getKeysAndTitles: any
  _funParam: any
  _tag: any
}

class RenderMd implements RenderMdType {
  parserResult
  options

  constructor(parserResult: ComponentInfo, options: MdOptions) {
    this.parserResult = parserResult
    this.options = options
  }

  render() {
    const mdArr: string[] = []

    for (const key in this.parserResult) {
      const element = this.parserResult[key as keyof ComponentInfo]

      if (element) {
        switch (key) {
          case 'desc':
            const desc = element as string
            mdArr.push(desc)
            break

          case 'events':
            if (this.options[key]) {
              mdArr.push(...this[`${key}Render`](element as Record<string, any>, this.options[key]))
            }

            break

          case 'methods':
            if (this.options[key]) {
              mdArr.push(...this[`${key}Render`](element as Record<string, any>, this.options[key]))
            }

            break

          case 'name':
            const name = element as string
            mdArr.push(...this.renderTitle(name, false, 2))
            break

          case 'props':
            if (this.options[key]) {
              mdArr.push(...this[`${key}Render`](element as Record<string, any>, this.options[key]))
            }

            break

          case 'slots':
            if (this.options[key]) {
              mdArr.push(...this[`${key}Render`](element as Record<string, any>, this.options[key]))
            }

            break

          default:
            break
        }
      }
    }

    return mdArr.join('\n')
  }
  /**
   * 渲染属性
   * @param {*} propsRes
   * @param {*} config 表格配置
   * @returns
   */

  propsRender(propsRes: Record<string, any>, config: MdOption) {
    const kt = this._getKeysAndTitles(config, ['default', 'desc', 'name', 'type'])

    const mdArr = [...this.renderTitle('Attributes'), ...this.renderTabelHeader(kt.titles)]

    for (const key in propsRes) {
      if (Object.hasOwnProperty.call(propsRes, key)) {
        const element = propsRes[key]
        const row: string[] = []
        kt.keys.map((key) => {
          if (Object.keys(element).includes(key)) {
            if (key === 'name') {
              row.push(`${element[key]}${this._tag(element, 'sync')}${this._tag(element, 'model')}`)
            } else {
              row.push(element[key])
            }
          } else {
            row.push('——')
          }
        })
        mdArr.push(this.renderTabelRow(row))
      }
    }

    return mdArr
  }
  /**
   * 渲染插槽
   * @param {*} slotsRes
   * @param {obj} config 表格配置
   * @returns
   */

  slotsRender(slotsRes: Record<string, any>, config: MdOption) {
    const kt = this._getKeysAndTitles(config, ['desc', 'name'])

    const mdArr = [...this.renderTitle('Slots'), ...this.renderTabelHeader(kt.titles)]

    for (const key in slotsRes) {
      if (Object.hasOwnProperty.call(slotsRes, key)) {
        const element = slotsRes[key]
        const row: string[] = []
        kt.keys.map((key) => {
          if (Object.keys(element).includes(key)) {
            row.push(element[key])
          } else {
            row.push('——')
          }
        })
        mdArr.push(this.renderTabelRow(row))
      }
    }

    return mdArr
  }
  /**
   * 渲染事件
   * @param {*} propsRes
   * @param {*} config 表格配置
   * @returns
   */

  eventsRender(propsRes: Record<string, any>, config: MdOption) {
    const kt = this._getKeysAndTitles(config, ['desc', 'name'])

    const mdArr = [...this.renderTitle('Events'), ...this.renderTabelHeader(kt.titles)]

    for (const key in propsRes) {
      if (Object.hasOwnProperty.call(propsRes, key)) {
        const element = propsRes[key]
        const row: string[] = []
        kt.keys.map((key) => {
          if (Object.keys(element).includes(key)) {
            row.push(element[key])
          } else {
            row.push('——')
          }
        })
        mdArr.push(this.renderTabelRow(row))
      }
    }

    return mdArr
  }
  /**
   * 渲染方法
   * @param {*} slotsRes
   * @param {*} config 表格配置
   * @returns
   */

  methodsRender(slotsRes: Record<string, any>, config: MdOption) {
    const kt = this._getKeysAndTitles(config, ['desc', 'name', 'params', 'res'])

    const mdArr = [...this.renderTitle('Methods'), ...this.renderTabelHeader(kt.titles)]

    for (const key in slotsRes) {
      if (Object.hasOwnProperty.call(slotsRes, key)) {
        const element = slotsRes[key]
        const row: string[] = []
        kt.keys.map((key) => {
          if (Object.keys(element).includes(key)) {
            if (key === 'name') {
              row.push(`${element[key]}${this._tag(element, 'async')}`)
            } else if (key === 'params') {
              row.push(this._funParam(element[key]))
            } else {
              row.push(element[key])
            }
          } else {
            row.push('——')
          }
        })
        mdArr.push(this.renderTabelRow(row))
      }
    }

    return mdArr
  }
  /**
   * 渲染表头
   * @param {Array} header
   * @returns
   */

  renderTabelHeader(header: string[]) {
    return [this.renderTabelRow(header), `|${header.map(() => '------').join('|')}|`]
  }
  /**
   * 渲染表格的行
   * @param {Array} row
   * @returns
   */

  renderTabelRow(row: string[]) {
    return `|${row.join('|')}|`
  }
  /**
   * 渲染标题
   * @param {String} title 标题
   * @param {Bool} br 是否换行
   * @param {Number} num 标题级别1-6
   * @returns
   */

  renderTitle(title: string, br = true, num = 3) {
    const h = ['#', '##', '###', '####', '#####', '######']
    return br ? ['', '', `${h[num - 1]} ${title}`] : [`${h[num - 1]} ${title}`]
  }
  /**
   * 生成表格配置
   * @param {*} config
   * @param {*} inKeys
   * @returns
   */

  _getKeysAndTitles(config: MdOption, inKeys: string[]) {
    const keys = Object.keys(config).filter((key) => inKeys.includes(key)) //@ts-ignore

    const titles = keys.map((key) => config[key])
    return {
      keys,
      titles
    }
  }
  /**
   * 生成入参格式
   * @param {Array}} params 参数
   * @returns
   */

  _funParam(params: MdOption[]) {
    if (!params) return '—'
    return params
      .map((item) => `${item.name}:${item.type}${item.desc ? `(${item.desc})` : ''}`)
      .join(',')
  }
  /**
   * 生成标记 例: sync、v-model
   * @param {Obj} item
   * @param {String} tag 标记
   * @returns
   */

  _tag(item: Record<string, any>, tag: string) {
    return item[tag] ? ` \`${tag}\` ` : ''
  }
}

export default RenderMd
