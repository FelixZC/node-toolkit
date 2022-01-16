import { upperFirstletter, writeFile } from './common'
import * as fs from 'fs'
import * as path from 'path'
import type {
  Headers,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ResponseObject,
} from 'openapi-typescript'

const EamsAmsprojService = require('../../api/eams-amsprojService.json')

const SystemBaseService = require('../../api/system-baseService.json')

const BaseStatsService = require('../../api/base-statsService.json')

interface CreateRequestTemplateExecListItem {
  resource: typeof EamsAmsprojService | typeof SystemBaseService
  typingPath: string
}
/**
 * 创建请求接口模板,并生成请求文件
 * @param options
 */

const tempPath = 'src/node/temp/'
export const invokeRequestTemplateGenerator = () => {
  const createRequestTemplateExecList: Array<CreateRequestTemplateExecListItem> =
    [
      {
        resource: EamsAmsprojService,
        typingPath: 'src/typings/interface/eams-amsprojService',
      },
      {
        resource: SystemBaseService,
        typingPath: 'src/typings/interface/system-baseService',
      },
      {
        resource: BaseStatsService,
        typingPath: 'src/typings/interface/base-statsService',
      },
    ]
  /**
   * 转化url的参数
   * @param url
   * @returns
   */

  const transferUrlParams = (url: string) => {
    const paramUrlReg = /\{(.*?)\}/g
    return url.replace(paramUrlReg, '${params.$1}')
  } //引入请求文件和参数定义文件

  const createRequestTemplate = (item: CreateRequestTemplateExecListItem) => {
    const resource = item.resource // const headers: Headers = {}

    const typingPath = item.typingPath
    const urls = resource.paths as Record<string, PathItemObject>
    const typingNamespaceName = upperFirstletter(
      `${resource.basePath.split('-')[0].replace('/', '')}ApiTyping`
    )
    let requestTemplate = `
      import request from '@/utils/request'
      import { ${typingNamespaceName} } from '${typingPath}'
    `
    let typingTemplate = ''

    for (const [url, methods] of Object.entries(urls)) {
      const requestUrl = resource.basePath + transferUrlParams(url)

      for (const [method, module] of Object.entries(
        methods as Record<keyof PathItemObject, OperationObject>
      )) {
        const parameters = module.parameters || ([] as ParameterObject[]) // const responses = module.responses as Record<string, ResponseObject>

        const annotation = module.tags?.join('-') + module!.summary
        const methodName = module.operationId
        const parametersPath = `operations['${module.operationId}']['parameters']`
        const responsePath = `operations['${module.operationId}']['responses'][200]['schema']`
        const paramsTypingPathRef = `${methodName}Parameters`
        const responseTypingPathRef = `${methodName}Responses`
        const paramsPosition = Array.from(
          new Set(parameters.filter((item) => item.in).map((item) => item.in))
        )
        const hasRef = parameters.some(
          (item) =>
            item.schema &&
            Reflect.get(item.schema, '$ref')
              ?.toLocaleLowerCase()
              ?.includes('bean')
        )
        const paramsTypingPath = paramsPosition.length
          ? paramsPosition
              .map((item) => {
                let result = `${parametersPath}['${item}']`

                if (item === 'body' && hasRef) {
                  result = `${result}[keyof ${result}]`
                }

                return result
              })
              .join('&')
          : 'null' // const responseTypingPath = `${responsePath}[keyof ${responsePath}]`

        const payloadName = method === 'get' ? 'params' : 'data' // 更改数据类型

        let contentType = (module as any).consumes?.length
          ? (module as any).consumes[0]
          : 'application/json' //替换文档consumes标注错误

        if (
          method === 'post' &&
          contentType === 'application/json' &&
          !paramsPosition.includes('body')
        ) {
          contentType = 'application/x-www-form-urlencoded'
        } // TODO添加请求头认证
        // parameters.forEach((param) => {
        //   if(param.in ==='header'){
        //   }
        // })
        //创建请求模板

        requestTemplate += `
          //${annotation}
          export const ${methodName} = (params: ${typingNamespaceName}.${paramsTypingPathRef}) => {
               return request({
                 url: \`${requestUrl}\`,
                 method: '${method}',
                 headers: {
                  'Content-Type': '${contentType}'
                },
                '${payloadName}':params
              })
            }
             `
        typingTemplate += `
          type ${paramsTypingPathRef} = ${paramsTypingPath}
          type ${responseTypingPathRef} = ${responsePath}
        `
      }
    }

    typingTemplate = `
      declare namespace ${typingNamespaceName}{
        ${typingTemplate}
      }
    `
    return {
      requestTemplate,
      typingTemplate,
    }
  }

  const writeRequestTemplate = () => {
    createRequestTemplateExecList.forEach((item) => {
      const { requestTemplate, typingTemplate } = createRequestTemplate(item)
      const execList = [
        {
          content: requestTemplate,
          writePath: path.join(tempPath, item.resource.basePath + '.ts'),
        },
        {
          content: typingTemplate,
          writePath: path.join(
            tempPath,
            item.resource.basePath + '-params-response.d.ts'
          ),
        },
      ]
      execList.forEach((item) => {
        writeFile(item.writePath, item.content)
      })
    })
  }

  return {
    writeRequestTemplate,
  }
}
