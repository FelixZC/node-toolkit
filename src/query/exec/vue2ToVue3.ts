import * as exec from './index'
import type { filterConditionType, execListType } from './index'
const exchangeVueFileGrammar = () => {
  const execList: execListType = [
    {
      reg: /<script>/g,
      matchContentHandle(content: string) {
        return `
        <script>
        import * as Vue from 'vue'
        `
      },
    },
    {
      reg: /export default (?<target>\{[\s\S\n]+)<\/script>/g,
      matchContentHandle(content: string) {
        return `Vue.defineComponent(${content})`
      },
    },
  ]
  const filterCondition: filterConditionType = (file) => {
    return file.extname === '.vue'
  }
  exec.batchReplaceByReg(execList, filterCondition)
}

const exchangJsToTs = () => {
  const fsInstance = exec.getFsInstance()
  fsInstance.modifyFileName(null, '.ts', null, '.js')
}
exchangeVueFileGrammar()
// exchangJsToTs()
