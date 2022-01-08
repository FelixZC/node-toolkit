import { declare } from '@babel/helper-plugin-utils'

const redefinedList = [
  {
    source: '@/router',
    defaultImportName: 'router',
    importNameList: []
  },
  {
    source: '@/store',
    defaultImportName: 'store',
    importNameList: []
  },
  {
    source: '@/components/common/extends/element/el-message-box',
    defaultImportName: 'MessageBox',
    importNameList: []
  },
  {
    source: '@/../config/ProjectConfig.js',
    defaultImportName: 'config',
    importNameList: []
  },
  {
    source: '@/api',
    defaultImportName: 'api',
    importNameList: []
  },
  {
    source: '@/utils/PublicMethod.js',
    defaultImportName: 'PublicMethod',
    importNameList: []
  },
  {
    source: '@/utils/PublicFormatter.js',
    defaultImportName: 'PublicFormatter',
    importNameList: []
  },
  {
    source: '@/utils/PublicMap.js',
    defaultImportName: 'PublicMap',
    importNameList: []
  },
  {
    source: '@/utils/PublicValidator.js',
    defaultImportName: 'PublicValidator',
    importNameList: []
  },
  {
    source: '@/utils/Constant.js',
    defaultImportName: 'Constant',
    importNameList: []
  },
  {
    source: '@/utils/ListDataUtil.js',
    defaultImportName: 'ListDataUtil',
    importNameList: []
  },
  {
    source: '@/utils/TreeDataUtil.js',
    defaultImportName: 'TreeDataUtil',
    importNameList: []
  },
  {
    source: '@/utils/PdfSignUtil.js',
    defaultImportName: 'PdfSignUtil',
    importNameList: []
  },
  {
    source: '@/utils/WindowUtils.js',
    defaultImportName: 'WindowUtils',
    importNameList: []
  },
  {
    source: '@/utils/bus.js',
  }
]
function firstToUpper(str) {
  return str.replace(/\b(\w)(\w*)/g, function ($0, $1, $2) {
    return $1.toUpperCase() + $2
  })
}
export default declare((babel) => {
  const { types: t } = babel
  const buildRequire = babel.template(`
  import IMPORT_NAME from 'SOURCE'
`)
  let refImportNameList = []
  let oldImportList = []
  return {
    name: 'ast-transform', // not required
    visitor: {
      ThisExpression(p) {
        const target = p.findParent((path) => path.isMemberExpression())
        if (target) {
          const trueTarget = target.findParent((path) => path.isMemberExpression())
          if (
            trueTarget &&
            target.node.property.name &&
            target.node.property.name.startsWith('$')
          ) {
            const invoke = trueTarget.node.property.name
            const reference = target.node.property.name.slice(1)
            if (redefinedList.some((i) => i.defaultImportName === reference)) {
              !refImportNameList.includes(reference) && refImportNameList.push(reference)
              if (invoke) {
                trueTarget.replaceWith(
                  t.MemberExpression(t.Identifier(firstToUpper(reference)), t.identifier(invoke))
                )
              } else {
                trueTarget.node.object = t.Identifier(firstToUpper(reference))
              }
            }
          }
        }
      },
      Program: {
        enter(path) {
          const improtList = path.node.body.filter((i) => i.type === 'ImportDeclaration')
          for (const item of improtList) {
            const importObj = {
              source: '',
              defaultImportName: '',
              importNameList: []
            }
            for (const specifier of item.specifiers) {
              if (specifier.type === 'ImportDefaultSpecifier') {
                importObj.defaultImportName = specifier.local.name
              }
              if (specifier.type === 'ImportSpecifier') {
                if (specifier.imported.name === specifier.local.name) {
                  importObj.importNameList.push(specifier.imported.name)
                } else {
                  importObj.importNameList.push(
                    `${specifier.imported.name} as ${specifier.local.name}`
                  )
                }
              }
            }
            importObj.source = item.source.value
            oldImportList.push(importObj)
          }
        },
        exit(path) {
          const oldDefaultImportNameList = oldImportList.map((item) => item.defaultImportName)
          const newDefaultImportNameList = []
          for (const name of refImportNameList) {
            if (!oldDefaultImportNameList.includes(name)) {
              const SOURCE = redefinedList.find((item) => item.defaultImportName === name).source
              const newImport = buildRequire({
                IMPORT_NAME: t.identifier(`${firstToUpper(name)}`),
                SOURCE
              })
              newDefaultImportNameList.push(newImport)
            }
          }
          path.node.body = newDefaultImportNameList.concat(path.node.body)
          refImportNameList = []
          oldImportList = []
        }
      }
    }
  }
})
