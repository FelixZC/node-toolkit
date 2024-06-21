import { configureStore } from '@reduxjs/toolkit'
import progressReducer from '../slices/progress-slice'
import directoryReducer from '../slices/directory-slice'

export interface RootState {
  progress: ReturnType<typeof progressReducer>
  directory: ReturnType<typeof directoryReducer>
}
const store = configureStore<RootState>({
  reducer: {
    progress: progressReducer,
    directory: directoryReducer
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: false
    })
  }
})
export default store
