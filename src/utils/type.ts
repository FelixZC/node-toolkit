// @ts-nocheck // 禁用 TypeScript 类型检查
import * as BaseStatsService from '../api/base-stats-service.json'
import { capitalize, writeFile } from './common'
import * as EamsAmsprojService from '../api/eams-amsproj-service.json'
import * as fs from 'fs'
import * as path from 'path'
import * as SystemBaseService from '../api/system-base-service.json'
import type {
  Headers,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ResponseObject
} from 'openapi-typescript'

// 定义 CreateRequestTemplateExecListItem 接口，用于存储资源文件和服务路径信息
interface CreateRequestTemplateExecListItem {
  resource: typeof EamsAmsprojService | typeof SystemBaseService | typeof BaseStatsService
  typingPath: string
}

/**
 * 创建请求接口模板并生成请求文件
 * @param options
 */
const tempPath = 'src/node/temp/'

export const invokeRequestTemplateGenerator = () => {
  // 创建一个执行列表，包含需要处理的资源及其对应的类型文件路径
  const createRequestTemplateExecList: Array<CreateRequestTemplateExecListItem> = [
    {
      resource: EamsAmsprojService,
      typingPath: 'src/typings/interface/eams-amsproj-service'
    },
    {
      resource: SystemBaseService,
      typingPath: 'src/typings/interface/system-base-service'
    },
    {
      resource: BaseStatsService,
      typingPath: 'src/typings/interface/base-stats-service'
    }
  ]

  /**
   * 将 URL 中的参数占位符替换为 TypeScript 模板字符串形式
   * @param url 待转换的原始 URL
   * @returns 转换后的 URL
   */
  const transferUrlParams = (url: string) => {
    const paramUrlReg = /\{(.*?)\}/g
    return url.replace(paramUrlReg, '${params.$1}')
  }

  /**
   * 从给定资源创建请求模板及类型定义模板
   * @param item 执行列表中的单个资源项
   * @returns 请求模板与类型定义模板对象
   */
  const createRequestTemplate = (item: CreateRequestTemplateExecListItem) => {
    const { resource } = item
    const { typingPath } = item
    const urls = resource.paths as Record<string, PathItemObject>
    const typingNamespaceName = capitalize(
      `${resource.basePath.split('-')[0].replace('/', '')}ApiTyping`
    )

    // 初始化请求模板与类型定义模板字符串
    let requestTemplate = `
      import request from '@/utils/request';
      import { ${typingNamespaceName} } from '${typingPath}';
    `
    let typingTemplate = ''

    // 遍历资源中的所有路径及对应方法
    for (const [url, methods] of Object.entries(urls)) {
      const requestUrl = resource.basePath + transferUrlParams(url)
      for (const [method, module] of Object.entries(
        methods as Record<keyof PathItemObject, OperationObject>
      )) {
        const parameters = module.parameters || ([] as ParameterObject[])
        const annotation = module.tags?.join('-') + module!.summary?.replace(/\//g, '')
        const methodName = module.operationId
        const parametersPath = `operations['${module.operationId}']['parameters']`
        const responsePath = `operations['${module.operationId}']['responses'][200]['schema']`
        const paramsTypingPathRef = `${methodName}Parameters`
        const responseTypingPathRef = `${methodName}Responses`

        // 计算参数位置集合
        const paramsPosition = Array.from(
          new Set(parameters.filter((item) => item.in).map((item) => item.in))
        )

        // 判断是否存在引用了 bean 的参数
        const hasRef = parameters.some(
          (item) =>
            item.schema && Reflect.get(item.schema, '$ref')?.toLocaleLowerCase()?.includes('bean')
        )

        // 构建参数类型路径
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
          : 'null'

        // 设置请求方法对应的 payload 名称
        const payloadName = method === 'get' ? 'params' : 'data'

        // 确定 Content-Type 标头
        let contentType = (module as any).consumes?.length
          ? (module as any).consumes[0]
          : 'application/json'

        // 根据方法与参数情况调整 Content-Type
        if (
          method === 'post' &&
          contentType === 'application/json' &&
          !paramsPosition.includes('body')
        ) {
          contentType = 'application/x-www-form-urlencoded'
        }

        // 生成请求模板代码
        requestTemplate += `
          /**
           * ${annotation}
           */
          export const ${methodName} = (params: ${typingNamespaceName}.${paramsTypingPathRef}) => {
            return request({
              url: \`${requestUrl}\`,
              method: '${method}',
              headers: {
                'Content-Type': '${contentType}',
              },
              ${payloadName}: params,
            });
          }
        `

        // 生成类型定义模板代码
        typingTemplate += `
          type ${paramsTypingPathRef} = ${paramsTypingPath};
          type ${responseTypingPathRef} = ${responsePath};
        `
      }
    }

    // 包裹类型定义模板为命名空间
    typingTemplate = `
      declare namespace ${typingNamespaceName} {
        ${typingTemplate}
      }
    `

    return { requestTemplate, typingTemplate }
  }

  /**
   * 将生成的请求模板与类型定义写入文件
   */
  const writeRequestTemplate = () => {
    createRequestTemplateExecList.forEach((item) => {
      const { requestTemplate, typingTemplate } = createRequestTemplate(item)
      const execList = [
        {
          content: requestTemplate,
          writePath: path.join(tempPath, `${item.resource.basePath}.ts`)
        },
        {
          content: typingTemplate,
          writePath: path.join(tempPath, `${item.resource.basePath}-params-response.d.ts`)
        }
      ]

      // 将每个模板内容写入对应文件
      execList.forEach((item) => {
        writeFile(item.writePath, item.content)
      })
    })
  }

  // 返回包含 writeRequestTemplate 方法的对象
  return { writeRequestTemplate }
}
