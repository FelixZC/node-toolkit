import { layoutSlice } from "@src/slices/layout-slice";
import { RootState } from "@src/store";
import { useDispatch, useSelector } from "react-redux";
const useLayout = () => {
  const dispatch = useDispatch();
  const { sliderWith } = useSelector((state: RootState) => state.layout);
  const setSliderWith = (width: number) =>
    dispatch(layoutSlice.actions.setSliderWith(width));
  return {
    sliderWith,
    setSliderWith,
  };
};
export default useLayout;
