const compiler = require('@vue/compiler-sfc')

const parse = require('@babel/parser')

const traverse = require('@babel/traverse')

const types = require('@babel/types')

const generate = require('@babel/generator')

const { RenderMd } = require('./render') // 默认生成配置

const baseConfig = {
  md: false,
} // md 生成配置

const mdOptions = {
  events: {
    desc: '说明',
    name: '事件名称',
  },
  methods: {
    desc: '说明',
    name: '方法名',
    params: '参数',
    res: '返回值',
  },
  props: {
    default: '默认值',
    desc: '说明',
    name: '参数',
    type: '类型',
  },
  slots: {
    desc: '说明',
    name: 'name',
  },
} // 提取Props

const extractProps = (node) => {
  let localNode = node
  const props = {} // 获取Props类型

  function getPropType(node) {
    if (types.isIdentifier(node)) {
      return node.name
    } else if (types.isArrayExpression(node)) {
      return node.elements.map((item) => item.name).join('、')
    } else {
      return 'Any'
    }
  } // 获取Props默认值

  function getDefaultVal(node) {
    if (
      types.isRegExpLiteral(node) ||
      types.isBooleanLiteral(node) ||
      types.isNumericLiteral(node) ||
      types.isStringLiteral(node)
    ) {
      return node.value
    } else if (
      types.isFunctionExpression(node) ||
      types.isArrowFunctionExpression(node) ||
      types.isObjectMethod(node)
    ) {
      try {
        const code = generate.default(
          types.isObjectMethod(node) ? node.body : node
        ).code
        const fun = eval(
          `0,${types.isObjectMethod(node) ? 'function ()' : ''} ${code}`
        )
        return JSON.stringify(fun())
      } catch (error) {}
    }
  } // 遍历 Props

  localNode.value.properties.forEach((prop) => {
    const {
      key: { name },
      leadingComments,
      value,
    } = prop
    props[name] = {
      name,
    }
    leadingComments && (props[name].desc = leadingComments[0].value.trim()) // 如果是标识或数组 说明只声明了类型

    if (types.isIdentifier(value) || types.isArrayExpression(value)) {
      props[name].type = getPropType(value)
    } else if (types.isObjectExpression(value)) {
      value.properties.map((item) => {
        let node = item
        if (types.isObjectProperty(item)) node = item.value

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
} // 提取方法信息

const extractMethods = (node) => {
  const methods = {}
  node.value.properties.forEach((item) => {
    if (types.isObjectMethod(item) && /^[^_]/.test(item.key.name)) {
      methods[item.key.name] = {
        async: item.async,
        name: item.key.name,
      }
    } else if (
      types.isObjectProperty(item) &&
      types.isFunctionExpression(item.value)
    ) {
      methods[item.key.name] = {
        async: item.value.async,
        name: item.key.name,
      }
    } else {
      return
    }

    if (item.leadingComments) {
      const comment = item.leadingComments[item.leadingComments.length - 1]

      if (comment.type === 'CommentLine') {
        methods[item.key.name].desc = comment.value.trim()
      } else {
        // 提取方法返回值
        const res = comment.value.match(/(@returns)[\s]*(.*)/)

        if (res) {
          methods[item.key.name].res = res[2]
        } // 提取方法说明

        const desc = comment.value.match(/\*\s*[^@]\s*(.*)/)

        if (desc) {
          methods[item.key.name].desc = desc[1]
        } // 提取 参数说明

        const matches = comment.value.matchAll(
          /(@param)[\s]*{([a-zA-Z]*)}[\s]*(\w*)(.*)/g
        )

        for (const matche of matches) {
          !methods[item.key.name].params && (methods[item.key.name].params = [])
          methods[item.key.name].params.push({
            desc: matche[4].trim(),
            name: matche[3],
            type: matche[2],
          })
        }
      }
    }
  })
  return methods
} // 提取事件

const extractEvents = (path) => {
  // 第一个元素是事件名称
  const eventName = path.parent.arguments[0]
  const comments = path.parentPath.parent.leadingComments
  return {
    desc: comments
      ? comments.map((item) => item.value.trim()).toString()
      : '——',
    name: eventName.value,
  }
} // 提取model

const extractModel = (node) => {
  const model = {}
  node.value.properties.forEach((item) => {
    const {
      key: { name },
      value: { value },
    } = item
    model[name] = value
  })
  return model
} // 处理是否支持 v-model 或者 .sync修饰

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
  } // 自定义v-mode

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
} // 遍历模板抽象数

const traverserTemplateAst = (ast, visitor = {}) => {
  function traverseArray(array, parent) {
    array.forEach((child) => {
      traverseNode(child, parent)
    })
  }

  function traverseNode(node, parent) {
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
  name: (item) => item.value.value,
  props: extractProps,
} // 转换文档

const parseDocs = (vueStr, config = {}) => {
  let localConfig = config
  localConfig = { ...baseConfig, ...localConfig }
  const componentInfo = {
    desc: undefined,
    events: undefined,
    methods: undefined,
    model: undefined,
    name: undefined,
    props: undefined,
    slots: undefined,
  }
  const vue = compiler.parse(vueStr)

  if (vue.script) {
    const jsAst = parse.parse(vue.script.content, {
      allowImportExportEverywhere: true,
      plugins: ['jsx'],
    }) // 遍历js抽象数

    traverse.default(jsAst, {
      ExportDefaultDeclaration(path) {
        // 组件描述
        if (path.node.leadingComments) {
          componentInfo.desc = path.node.leadingComments
            .map((item) => {
              if (item.type === 'CommentLine') {
                return item.value.trim()
              } else {
                return item.value
                  .split('\n')
                  .map((item) => item.replace(/[\s\*]/g, ''))
                  .filter(Boolean)
              }
            })
            .toString()
        }

        path.node.declaration.properties.forEach((item) => {
          if (extract[item.key.name])
            componentInfo[item.key.name] = extract[item.key.name](item)
        })
      },

      MemberExpression(path) {
        // 判断是不是event
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
      },
    })
    isModelAndSync(componentInfo)
  }

  if (vue.template) {
    const template = compiler.compile(vue.template.content, {
      comments: true,
      preserveWhitespace: false,
    }) // 遍历模板抽象数

    traverserTemplateAst(template.ast, {
      slot(node, parent) {
        !componentInfo.slots && (componentInfo.slots = {})
        const index = parent.children.findIndex((item) => item === node)
        let desc = '无描述'
        let name = '-'

        if (index > 0) {
          const tag = parent.children[index - 1]

          if (tag.isComment) {
            desc = tag.text.trim()
          }
        }

        if (node.slotName) name = node.attrsMap.name
        componentInfo.slots[name] = {
          desc,
          name,
        }
      },
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

module.exports = {
  parseDocs,
  RenderMd,
}
