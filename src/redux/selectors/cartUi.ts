import type { RootState } from "@/redux/store";
import { cartApi } from "@/redux/api/cart";

const selectCartResult = (state: RootState) =>
  cartApi.endpoints.getCart.select(undefined)(state);
const selectCartData = (state: RootState) => selectCartResult(state)?.data;

/** UI selectors: list, badge, empty state. Read from cartApi cache. */
export const selectCartItems = (state: RootState) => selectCartData(state)?.items ?? [];
export const selectCartTotalQuantity = (state: RootState) =>
  selectCartData(state)?.totalQuantity ?? 0;
export const selectCartIsEmpty = (state: RootState) =>
  (selectCartData(state)?.items?.length ?? 0) === 0;
