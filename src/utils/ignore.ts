import { app } from 'electron'
import fs from 'fs-extra'
import ignore from 'ignore'
import path from 'path'
export function getIgnorePath(): string {
  const basePath = process.env.NODE_ENV === 'production' ? app.getPath('appData') : process.cwd()
  return path.join(basePath, '.gitignore')
}
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
class GitIgnoreParser {
  private ignoreRules: ReturnType<typeof ignore>
  constructor() {
    this.ignoreRules = ignore()
  }
  loadFromFile() {
    const gitIgnorePath = getIgnorePath()
    const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf-8')
    this.ignoreRules.add(gitIgnoreContent)
  }
  test(filePath: string): boolean {
    // 传入的 filePath 应该是相对于项目根目录的相对路径
    return this.ignoreRules.ignores(filePath)
  }
}
export function useIgnored(): {
  ignore: (filePath: string) => boolean
} {
  const parser = new GitIgnoreParser()
  parser.loadFromFile()
  return {
    ignore: (filePath: string) => parser.test(filePath)
  }
}
initIgnorePath()
