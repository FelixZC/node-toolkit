/**
 * 提取vue2组件信息，搬运自https://github.com/MaLuns/generate-vue-docs
 */
import * as compiler from '@vue/compiler-sfc'
import * as generator from '@babel/generator'
import { getParserOption } from '../babel-plugins/ast-utils'
import * as parser from '@babel/parser'
import RenderMd from './render'
import type { ElementNode } from '@vue/compiler-core'
/*  默认生成配置 */
import * as t from '@babel/types'
import * as traverse from '@babel/traverse'
import { NodePath } from '@babel/traverse'
import { traverserTemplateAst } from '../ast-utils'
import type { AttributeNode } from '@vue/compiler-core'
const baseConfig = {
  md: false
}
/*  md 生成配置 */
export interface MdOption {
  desc: string
  name: string
  params?: string
  res?: string
  default?: string
  type?: string
}
export interface MdOptions {
  events: MdOption
  methods: MdOption
  props: MdOption
  slots: MdOption
}
const mdOptions: MdOptions = {
  props: {
    name: '参数',
    desc: '说明',
    type: '类型',
    default: '默认值'
  },
  slots: {
    name: 'name',
    desc: '说明'
  },
  events: {
    name: '事件名称',
    desc: '说明'
  },
  methods: {
    name: '方法名',
    desc: '说明',
    params: '参数',
    res: '返回值'
  }
}
/*  提取Props */

const extractProps = (node: t.ObjectProperty | t.ObjectMethod) => {
  const props: Record<string, any> = {}

  if (t.isObjectMethod(node)) {
    return props
  }
  /*  获取Props类型 */

  function getPropType(node: t.Expression | t.PatternLike) {
    if (t.isIdentifier(node)) {
      return node.name
    }

    if (t.isArrayExpression(node)) {
      return node.elements.map((item) => (item as t.Identifier).name).join('、')
    }

    return 'Any'
  }
  /*  获取Props默认值 */

  function getDefaultVal(node: t.Expression | t.PatternLike) {
    if (t.isBooleanLiteral(node) || t.isNumericLiteral(node) || t.isStringLiteral(node)) {
      return node.value
    }

    if (t.isRegExpLiteral(node)) {
      return node.pattern
    }

    if (t.isFunction(node)) {
      try {
        const { code } = generator.default(node.body)
        const fun = eval(`0,function ()${code}`)
        return JSON.stringify(fun())
      } catch (error) {}
    }
  }
  /*  遍历 Props */

  ;(node.value as t.ObjectExpression)?.properties?.forEach((property) => {
    if (t.isObjectProperty(property)) {
      const key = (property.key as t.Identifier).name || (property.key as t.StringLiteral).value
      const { leadingComments, value } = property
      props[key] = {
        key
      }
      leadingComments && (props[key].desc = leadingComments[0].value.trim())
      /*  如果是标识或数组 说明只声明了类型 */

      if (t.isIdentifier(value) || t.isArrayExpression(value)) {
        props[key].type = getPropType(value)
      } else if (t.isObjectExpression(value)) {
        value.properties.map((item) => {
          if (t.isObjectProperty(item)) {
            const subKey = (item.key as t.Identifier).name || (item.key as t.StringLiteral).value

            if (subKey === 'type' && t.isObjectProperty(item)) {
              props[key].type = getPropType(item.value)
            } else if (subKey === 'default') {
              props[key][subKey] = getDefaultVal(item.value)
            } else if (subKey === 'validator') {
              props[key][key] = generator.default(item).code
            } else if (subKey === 'required' && t.isBooleanLiteral(item.value)) {
              props[key][subKey] = item.value.value
            }
          }
        })
      }
    }
  })
  return props
}
/*  提取方法信息 */

const extractMethods = (node: t.ObjectProperty | t.ObjectMethod) => {
  const methods: Record<string, any> = {}

  if (t.isObjectMethod(node)) {
    return methods
  }

  if (t.isObjectExpression(node.value)) {
    node.value.properties.forEach((property) => {
      if (!t.isSpreadElement(property)) {
        const key = (property.key as t.Identifier).name || (property.key as t.StringLiteral).value

        if (t.isObjectMethod(property) && /^[^_]/.test(key)) {
          methods[key] = {
            async: property.async,
            name: key
          }
        } else if (t.isObjectProperty(property) && t.isFunctionExpression(property.value)) {
          methods[key] = {
            async: property.value.async,
            name: key
          }
        } else {
          return
        }

        if (property.leadingComments) {
          const comment = property.leadingComments[property.leadingComments.length - 1]

          if (comment.type === 'CommentLine') {
            methods[key].desc = comment.value.trim()
          } else {
            /*  提取方法返回值 */
            const res = comment.value.match(/(@returns)[\s]*(.*)/)

            if (res) {
              methods[key].res = res[2]
            }
            /*  提取方法说明 */

            const desc = comment.value.match(/\*\s*[^@]\s*(.*)/)

            if (desc) {
              methods[key].desc = desc[1]
            }
            /*  提取 参数说明 */

            const matches = comment.value.matchAll(/(@param)[\s]*{([a-zA-Z]*)}[\s]*(\w*)(.*)/g) //@ts-ignore

            for (const matche of matches) {
              !methods[key].params && (methods[key].params = [])
              methods[key].params.push({
                desc: matche[4].trim(),
                name: matche[3],
                type: matche[2]
              })
            }
          }
        }
      }
    })
  }

  return methods
}
/*  提取事件 */

const extractEvents = (path: NodePath<t.MemberExpression>) => {
  /*  第一个元素是事件名称 */
  const parentPath = path.findParent((item) =>
    t.isCallExpression(item as t.Node | null | undefined)
  ) as NodePath<t.CallExpression>
  const eventName = parentPath.node.arguments[0] as t.StringLiteral
  const comments = parentPath.parent.leadingComments //ExpressionStatement

  return {
    desc: comments ? comments.map((item) => item.value.trim()).toString() : '——',
    name: eventName.value
  }
}
/*  提取model */

const extractModel = (node: t.ObjectProperty | t.ObjectMethod) => {
  const model: Record<string, any> = {}

  if (t.isObjectMethod(node)) {
    return model
  }

  if (t.isObjectExpression(node.value)) {
    node.value.properties.forEach((property) => {
      if (t.isObjectProperty(property)) {
        const key = (property.key as t.Identifier).name || (property.key as t.StringLiteral).value
        const value = (property.value as t.StringLiteral).value
        model[key] = value
      }
    })
  }

  return model
}
/*  处理是否支持 v-model 或者 .sync修饰 */

const isModelAndSync = (comInfo: ComponentInfo) => {
  for (const key in comInfo.events as Record<string, any>) {
    if (Object.hasOwnProperty.call(comInfo.events, key)) {
      if (key === 'update') {
        if (comInfo.props.value) {
          comInfo.props.value.model = true
          Reflect.deleteProperty(comInfo.events, 'update')
        }
      } else if (key.includes('update:')) {
        const prop = key.split(':')[1]
        comInfo.props[prop].sync = true
        Reflect.deleteProperty(comInfo.events, key)
      }
    }
  }
  /*  自定义v-mode */

  if (comInfo.model) {
    const { event = 'update', prop = 'value' } = comInfo.model

    if (comInfo.events[event]) {
      if (comInfo.props[prop]) {
        comInfo.props[prop].model = true
        Reflect.deleteProperty(comInfo.events, event)
        Reflect.deleteProperty(comInfo, 'model')
      }
    }
  }
}

const getComponentName = (node: t.ObjectProperty | t.ObjectMethod) => {
  if (t.isObjectMethod(node)) {
    return
  }

  if (t.isStringLiteral(node.value)) {
    return node.value.value
  }
}

interface Extract {
  methods: typeof extractMethods
  model: typeof extractModel
  name: typeof getComponentName
  props: typeof extractProps
}
const extract: Extract = {
  methods: extractMethods,
  model: extractModel,
  name: getComponentName,
  props: extractProps
}
export interface ComponentInfo {
  name?: string
  desc: string
  props: Record<string, any>
  model: Record<string, any>
  methods: Record<string, any>
  events: Record<string, any>
  slots: Record<string, any>
}
/*  转换文档 */
const parseDocs = (vueStr: string, config: Record<string, any> = {}) => {
  let localConfig = config
  localConfig = { ...baseConfig, ...localConfig }
  const componentInfo: ComponentInfo = {
    desc: '',
    props: {},
    model: {},
    methods: {},
    events: {},
    slots: {}
  }
  const vue = compiler.parse(vueStr)
  const script = compiler.compileScript(vue.descriptor, {
    id: 'pzc'
  })

  if (script.content.length) {
    const jst = parser.parse(script.content, getParserOption())
    traverse.default(jst, {
      ExportDefaultDeclaration(path) {
        /*  组件描述 */
        if (path.node.leadingComments) {
          componentInfo.desc = path.node.leadingComments
            .map((item) => {
              if (item.type === 'CommentLine') {
                return item.value.trim()
              }

              return item.value
                .split('\n')
                .map((item) => item.replace(/[\s\*]/g, ''))
                .filter(Boolean)
            })
            .toString()
        }

        if (t.isObjectExpression(path.node.declaration)) {
          path.node.declaration.properties.forEach((item) => {
            if (!t.isSpreadElement(item)) {
              const key = (item.key as t.Identifier).name || (item.key as t.StringLiteral).value

              if (Reflect.has(extract, key)) {
                //@ts-ignore
                componentInfo[key] = extract[key](item)
              }
            }
          })
        }
      },

      MemberExpression(path) {
        /*  判断是不是event */
        if (t.isIdentifier(path.node.property) && path.node.property.name === '$emit') {
          const event = extractEvents(path)
          !componentInfo.events && (componentInfo.events = {})

          if (componentInfo.events[event.name]) {
            componentInfo.events[event.name].desc = event.desc
              ? event.desc
              : componentInfo.events[event.name].desc
          } else {
            componentInfo.events[event.name] = event
          }
        }
      }
    })
    isModelAndSync(componentInfo)
  }

  if (vue.descriptor.template && vue.descriptor.template.ast) {
    traverserTemplateAst(vue.descriptor.template.ast as unknown as ElementNode, {
      slot(node, parent) {
        if (parent) {
          !componentInfo.slots && (componentInfo.slots = {})
          const index = parent.children.findIndex((item) => item === node)
          let desc = '无描述'
          let name = '-'

          if (index > 0) {
            const tag = parent.children[index - 1]

            if (tag.type === 3) {
              desc = tag.content.trim()
            }
          }

          if (node.tagType === 2) {
            const nameAttr = node.props.find((prop) => prop.name === 'name')

            if (nameAttr && Reflect.has(nameAttr, 'value')) {
              name = (nameAttr as AttributeNode).value?.content || name
            }
          }

          componentInfo.slots[name] = {
            desc,
            name
          }
        }

        return node
      }
    })
  }

  if (localConfig.md) {
    const option = { ...mdOptions }

    if (localConfig.mdOptions) {
      Object.assign(option, localConfig.mdOptions)
    }

    return new RenderMd(componentInfo, option).render()
  }

  return ''
}

export { parseDocs, RenderMd }
