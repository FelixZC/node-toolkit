import * as exec from './index'
import type { FilterConditionType, ExecListType } from './index'
const exchangeVueFileGrammar = () => {
  const execList: ExecListType = [
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
  const filterCondition: FilterConditionType = (file) => {
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
