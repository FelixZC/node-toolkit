/**
 * 查询文件包含方法名，临时用
 */
import { declare } from '@babel/helper-plugin-utils'
import { getFunctionName, getGeneratorOption } from './ast-utils'
import { writeFile, strToJson } from '../../utils/common'
import * as t from '@babel/types'
import generator from '@babel/generator'
// import { NodePath } from '@babel/core'
export default declare((babel) => {
  const functionNameList: (string | number)[] = []
  return {
    name: 'ast-transform',
    visitor: {
      Function(path) {
        try {
          const functionName = getFunctionName(path)
          if (functionName && !functionNameList.includes(functionName)) {
            functionNameList.push(functionName)
          }
        } catch (err) {
          console.error(err)
          console.log(path.node)
        }
      },
      Program: {
        exit(path) {
          const objectExpression = t.objectExpression(
            [functionNameList].map((name) =>
              t.objectProperty(t.identifier(String(name)), t.identifier(String(name)), false, true)
            )
          )
          const outputOjb = strToJson(generator(objectExpression, getGeneratorOption()).code)
          writeFile('src/query/json/function-name.json', JSON.stringify(outputOjb, null, 2))
        }
      }
    }
  }
})
