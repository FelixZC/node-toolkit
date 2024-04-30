/**
 * 定义 ExecFileInfo 接口
 * 用于描述执行文件的信息
 *
 * @property {string} source 表示文件的源代码
 * @property {string} path 表示文件的路径
 * @property {Record<string, any>?} extra 可选的额外信息，以键值对的形式存储
 */
export interface ExecFileInfo {
  source: string
  path: string
  extra?: Record<string, any>
}
