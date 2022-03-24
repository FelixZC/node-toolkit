import * as exec from './index'
const reg = /(\w+)?(Date|Term)\b/gi
exec.queryByReg(reg, true)
