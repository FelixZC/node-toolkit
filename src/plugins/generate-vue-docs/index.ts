//@ts-nocheck

/**
 * 提取vue2组件信息，搬运自https://github.com/MaLuns/generate-vue-docs
 */
import * as compiler from '@vue/compiler-sfc'
import * as generate from '@babel/generator'
import * as parser from '@babel/parser'
import * as t from '@babel/types'
import * as traverse from '@babel/traverse'
import type { AttributeNode, ElementNode, TemplateChildNode } from '@vue/compiler-core'

const { RenderMd } = require('./render')
/*  默认生成配置 */

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

const extractProps = (node: t.ObjectMethod | t.ObjectProperty) => {
  const localNode = node
  const props = {}
  /*  获取Props类型 */

  function getPropType(node: t.Identifier | t.ArrayExpression) {
    if (t.isIdentifier(node)) {
      return node.name
    }

    if (t.isArrayExpression(node)) {
      return node.elements.map((item) => item.name).join('、')
    }

    return 'Any'
  }
  /*  获取Props默认值 */

  function getDefaultVal(node: t.ObjectMethod | t.ObjectProperty | t.SpreadElement) {
    if (
      t.isRegExpLiteral(node) ||
      t.isBooleanLiteral(node) ||
      t.isNumericLiteral(node) ||
      t.isStringLiteral(node)
    ) {
      return node.value
    }

    if (
      t.isFunctionExpression(node) ||
      t.isArrowFunctionExpression(node) ||
      t.isObjectMethod(node)
    ) {
      try {
        const { code } = generate.default(t.isObjectMethod(node) ? node.body : node)
        const fun = eval(`0,${t.isObjectMethod(node) ? 'function ()' : ''} ${code}`)
        return JSON.stringify(fun())
      } catch (error) {}
    }
  }
  /*  遍历 Props */

  localNode.value.properties.forEach((prop) => {
    const {
      key: { name },
      leadingComments,
      value
    } = prop
    props[name] = {
      name
    }
    leadingComments && (props[name].desc = leadingComments[0].value.trim())
    /*  如果是标识或数组 说明只声明了类型 */

    if (t.isIdentifier(value) || t.isArrayExpression(value)) {
      props[name].type = getPropType(value)
    } else if (t.isObjectExpression(value)) {
      value.properties.map((item) => {
        let node = item
        if (t.isObjectProperty(item)) node = item.value

        if (item.key.name === 'type') {
          props[name].type = getPropType(item.value)
        } else if (item.key.name === 'default') {
          props[name][item.key.name] = getDefaultVal(node)
        } else if (item.key.name === 'validator') {
          //  props[name][item.key.name] = getValidator(node)
        } else if (item.key.name === 'required') {
          props[name][item.key.name] = item.value.value
        }
      })
    }
  })
  return props
}
/*  提取方法信息 */

const extractMethods = (node: t.ObjectMethod | t.ObjectProperty) => {
  const methods = {}
  node.value.properties.forEach((item) => {
    if (t.isObjectMethod(item) && /^[^_]/.test(item.key.name)) {
      methods[item.key.name] = {
        async: item.async,
        name: item.key.name
      }
    } else if (t.isObjectProperty(item) && t.isFunctionExpression(item.value)) {
      methods[item.key.name] = {
        async: item.value.async,
        name: item.key.name
      }
    } else {
      return
    }

    if (item.leadingComments) {
      const comment = item.leadingComments[item.leadingComments.length - 1]

      if (comment.type === 'CommentLine') {
        methods[item.key.name].desc = comment.value.trim()
      } else {
        /*  提取方法返回值 */
        const res = comment.value.match(/(@returns)[\s]*(.*)/)

        if (res) {
          methods[item.key.name].res = res[2]
        }
        /*  提取方法说明 */

        const desc = comment.value.match(/\*\s*[^@]\s*(.*)/)

        if (desc) {
          methods[item.key.name].desc = desc[1]
        }
        /*  提取 参数说明 */

        const matches = comment.value.matchAll(/(@param)[\s]*{([a-zA-Z]*)}[\s]*(\w*)(.*)/g)

        for (const matche of matches) {
          !methods[item.key.name].params && (methods[item.key.name].params = [])
          methods[item.key.name].params.push({
            desc: matche[4].trim(),
            name: matche[3],
            type: matche[2]
          })
        }
      }
    }
  })
  return methods
}
/*  提取事件 */

const extractEvents = (path) => {
  /*  第一个元素是事件名称 */
  const eventName = path.parent.arguments[0]
  const comments = path.parentPath.parent.leadingComments
  return {
    desc: comments ? comments.map((item) => item.value.trim()).toString() : '——',
    name: eventName.value
  }
}
/*  提取model */

const extractModel = (node: t.ObjectMethod | t.ObjectProperty) => {
  const model = {}
  node.value.properties.forEach((item) => {
    const {
      key: { name },
      value: { value }
    } = item
    model[name] = value
  })
  return model
}
/*  处理是否支持 v-model 或者 .sync修饰 */

const isModelAndSync = (comInfo) => {
  for (const key in comInfo.events) {
    if (Object.hasOwnProperty.call(comInfo.events, key)) {
      if (key === 'update') {
        if (comInfo.props.value) {
          comInfo.props.value.model = true
          delete comInfo.events.update
        }
      } else if (key.includes('update:')) {
        const prop = key.split(':')[1]
        comInfo.props[prop].sync = true
        delete comInfo.events[key]
      }
    }
  }
  /*  自定义v-mode */

  if (comInfo.model) {
    const { event = 'update', prop = 'value' } = comInfo.model

    if (comInfo.events[event]) {
      if (comInfo.props[prop]) {
        comInfo.props[prop].model = true
        delete comInfo.events[event]
        delete comInfo.model
      }
    }
  }
}
/*  遍历模板抽象数 */

const traverserTemplateAst = (ast: ElementNode, visitor = {}) => {
  function traverseArray(array: TemplateChildNode[], parent: ElementNode) {
    array.forEach((child) => {
      traverseNode(child as ElementNode, parent)
    })
  }

  function traverseNode(node: ElementNode, parent: ElementNode) {
    visitor.enter && visitor.enter(node, parent)
    visitor[node.tag] && visitor[node.tag](node, parent)
    node.children && traverseArray(node.children, node)
    visitor.exit && visitor.exit(node, parent)
  }

  traverseNode(ast, null)
}

const extract = {
  methods: extractMethods,
  model: extractModel,
  name: (item: t.ObjectMethod | t.ObjectProperty) => item.value.value,
  props: extractProps
}
/*  转换文档 */

const parseDocs = (vueStr: string, config = {}) => {
  let localConfig = config
  localConfig = { ...baseConfig, ...localConfig }
  const componentInfo = {
    desc: undefined,
    events: undefined,
    methods: undefined,
    model: undefined,
    name: undefined,
    props: undefined,
    slots: undefined
  }
  const vue = compiler.parse(vueStr)

  if (vue.descriptor.script || vue.descriptor.scriptSetup) {
    const content = vue.descriptor.script?.content || vue.descriptor.scriptSetup?.content

    if (content) {
      const jst = parser.parse(content, {
        allowImportExportEverywhere: false,
        plugins: ['decorators-legacy', 'jsx', 'typescript'],
        sourceType: 'module'
      })
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

                if (extract[key]) {
                  componentInfo[key] = extract[key](item)
                }
              }
            })
          }
        },

        MemberExpression(path) {
          /*  判断是不是event */
          if (path.node.property.name === '$emit') {
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
  }

  if (vue.descriptor.template) {
    traverserTemplateAst(vue.descriptor.template.ast, {
      slot(node: ElementNode, parent: ElementNode) {
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
    })
  }

  if (localConfig.md) {
    const option = { ...mdOptions }

    if (localConfig.mdOptions) {
      Object.assign(option, localConfig.mdOptions)
    }

    return new RenderMd(componentInfo, option).render()
  }

  return componentInfo
}

export { parseDocs, RenderMd }
