import type { RootState } from "@/redux/store";
import { cartApi } from "@/redux/api/cart";
import type { CartItem } from "@/types";

const selectCartResult = (state: RootState) =>
  cartApi.endpoints.getCart.select(undefined)(state);
const selectCartData = (state: RootState) => selectCartResult(state)?.data;

const EMPTY_ITEMS: CartItem[] = [];

/** UI selectors: list, badge, empty state. Read from cartApi cache. Returns stable empty array when no items. */
export const selectCartItems = (state: RootState): CartItem[] =>
  selectCartData(state)?.items ?? EMPTY_ITEMS;
export const selectCartTotalQuantity = (state: RootState) =>
  selectCartData(state)?.totalQuantity ?? 0;
export const selectCartIsEmpty = (state: RootState) =>
  (selectCartData(state)?.items?.length ?? 0) === 0;
