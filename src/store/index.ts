// app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import progressReducer from '@src/slices/progress-slice'

// 定义整个应用的状态类型
export interface RootState {
  progress: ReturnType<typeof progressReducer>
}
const store = configureStore<RootState>({
  reducer: {
    progress: progressReducer
  }
})
export default store
