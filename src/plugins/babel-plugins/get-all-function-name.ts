import { declare } from '@babel/helper-plugin-utils'
import generator from '@babel/generator' // import { NodePath } from '@babel/core'
import { getFunctionName, getGeneratorOption } from './ast-utils'
import { strToJson, writeFile } from '../../utils/common'
import * as t from '@babel/types'

/**
 * 查询文件包含方法名，临时用
 * 声明一个Babel插件，用于转换AST（抽象语法树），收集并保存函数名到一个json文件。
 * @param babel Babel的上下文对象，提供插件需要的工具和API。
 * @returns 返回一个定义了插件行为的对象，包含name和visitor属性。
 */
export default declare((babel) => {
  // 存储收集到的函数名列表
  const functionNameList: (string | number)[] = []

  return {
    name: 'ast-transform', // 插件名称
    visitor: {
      // 遍历AST中的Function节点，收集函数名
      Function(path) {
        try {
          const functionName = getFunctionName(path) // 获取当前函数名

          if (functionName && !functionNameList.includes(functionName)) {
            functionNameList.push(functionName) // 如果函数名未被收集，则添加到列表
          }
        } catch (err) {
          console.error(err) // 处理异常，并打印错误信息
          console.log(path.node) // 打印当前节点信息，用于调试
        }
      },

      // 当遍历到Program节点（整个代码文件）时，退出处理，并将收集到的函数名写入json文件
      Program: {
        exit(path) {
          // 将函数名列表转换成一个对象表达式
          const objectExpression = t.objectExpression(
            [functionNameList].map((name) =>
              t.objectProperty(t.identifier(String(name)), t.identifier(String(name)), false, true)
            )
          )
          // 使用Babel的generator将对象表达式转换成字符串
          const outputOjb = strToJson(generator(objectExpression, getGeneratorOption(), '').code)
          // 将结果写入到指定的json文件
          writeFile('src/query/json/function-name.json', JSON.stringify(outputOjb, null, 2))
        }
      }
    }
  }
})
