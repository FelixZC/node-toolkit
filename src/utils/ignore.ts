import { app } from 'electron'
import fs from 'fs-extra'
import ignore from 'ignore'
import path from 'path'
/**
 * 获取忽略文件的路径。
 *
 * 根据环境变量决定是使用应用数据目录还是当前工作目录。
 * 返回拼接后的 .gitignore 文件路径。
 */
export function getIgnorePath(): string {
  const basePath = process.env.NODE_ENV === 'production' ? app.getPath('appData') : process.cwd()
  return path.join(basePath, '.gitignore')
}

/**
 * 初始化忽略文件路径。
 *
 * 检查是否存在 .gitignore 文件，如果不存在，则创建一个默认的忽略文件。
 */
export function initIgnorePath() {
  const gitIgnorePath = getIgnorePath()
  if (!fs.existsSync(gitIgnorePath)) {
    fs.ensureFileSync(gitIgnorePath)
    const gitIgnoreContent = `
# Default ignore rules
node_modules
dist
.npmrc
.cache
.local
.git
.history
# Editor directories and files
.idea
.vscode
.husky
`
    fs.writeFileSync(gitIgnorePath, gitIgnoreContent)
  }
}

/**
 * GitIgnoreParser 类用于解析 .gitignore 文件中的忽略规则。
 */
class GitIgnoreParser {
  private ignoreRules: ReturnType<typeof ignore>
  constructor() {
    this.ignoreRules = ignore()
  }

  /**
   * 从文件中加载忽略规则。
   *
   * 加载并解析 .gitignore 文件的内容，将其作为忽略规则。
   */
  loadFromFile() {
    const gitIgnorePath = getIgnorePath()
    const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf-8')
    this.ignoreRules.add(gitIgnoreContent)
  }

  /**
   * 测试文件路径是否被忽略。
   *
   * @param filePath 文件路径
   * @returns 返回布尔值，表示文件路径是否被忽略。
   */
  test(filePath: string): boolean {
    // 传入的 filePath 应该是相对于项目根目录的相对路径
    return this.ignoreRules.ignores(filePath)
  }
}

/**
 * 提供一个用于检查文件是否被忽略的钩子。
 *
 * @returns 返回一个对象，其中的 ignore 方法可用于检查文件路径是否被忽略。
 */
export function useIgnored(): {
  ignore: (filePath: string) => boolean
} {
  const parser = new GitIgnoreParser()
  parser.loadFromFile()
  return {
    ignore: (filePath: string) => parser.test(filePath)
  }
}

// 初始化忽略文件路径。
initIgnorePath()
