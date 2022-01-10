import { declare } from '@babel/helper-plugin-utils'
export default declare((babel) => {
  const { types: t } = babel
  const importList = []
  return {
    name: 'ast-transform',
    // not required
    visitor: {
      Program: {
        exit(path) {
          const improtList = path.node.body.filter(
            (i) => i.type === 'ImportDeclaration'
          )

          for (const item of improtList) {
            const importObj = {
              defaultImportName: '',
              importNameList: [],
              source: '',
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
            importList.push(importObj)
          }

          console.log(importList)
        },
      },
    },
  }
})
