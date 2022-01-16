import * as exec from './index'

import type { ExecListType, FilterConditionType } from './index'

const exchangeVueFileGrammar = () => {
  const execList: ExecListType = [
    {
      matchContentHandle(content: string) {
        return `<script>
        import * as Vue from 'vue'`
      },

      reg: /<script>/g,
    },
    {
      matchContentHandle(content: string) {
        return `Vue.defineComponent(${content})`
      },

      reg: /export default (?<target>\{[\s\S\n]+)<\/script>/g,
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
