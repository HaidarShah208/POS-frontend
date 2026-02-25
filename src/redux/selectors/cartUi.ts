import type { RootState } from "@/redux/store";

/** UI selectors: list, badge, empty state. No heavy computation. */
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotalQuantity = (state: RootState) => state.cart.totalQuantity;
export const selectCartIsEmpty = (state: RootState) => state.cart.items.length === 0;
