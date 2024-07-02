import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export interface LayoutState {
  sliderWith: number;
}
const initialState: LayoutState = {
  sliderWith: 200,
};
export const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    setSliderWith: (state, action: PayloadAction<number>) => {
      state.sliderWith = action.payload;
    },
  },
});
export default layoutSlice.reducer;
