import { configureStore } from '@reduxjs/toolkit'
import directoryReducer from '../slices/directory-slice'
export interface RootState {
  directory: ReturnType<typeof directoryReducer>
}
const store = configureStore<RootState>({
  reducer: {
    directory: directoryReducer
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: false
    })
  }
})
export default store
