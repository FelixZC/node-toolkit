import { configureStore } from "@reduxjs/toolkit";
import directoryReducer from "../slices/directory-slice";
import layout from "../slices/layout-slice";
export interface RootState {
  directory: ReturnType<typeof directoryReducer>;
  layout: ReturnType<typeof layout>;
}
const store = configureStore<RootState>({
  reducer: {
    directory: directoryReducer,
    layout: layout,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: false,
    });
  },
});
export default store;
