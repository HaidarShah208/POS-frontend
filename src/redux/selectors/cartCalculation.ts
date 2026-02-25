import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

/** Base selectors for calculation inputs */
const selectCartItems = (state: RootState) => state.cart.items;
const selectCartDiscount = (state: RootState) => state.cart.discount;

/** Memoized calculation selectors – only recompute when items or discount change */
export const selectCartSubtotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const TAX_RATE = 0.08;

export const selectCartTax = createSelector(
  [selectCartSubtotal, selectCartDiscount],
  (subtotal, discount) => (subtotal - discount) * TAX_RATE
);

export const selectCartGrandTotal = createSelector(
  [selectCartSubtotal, selectCartDiscount, selectCartTax],
  (subtotal, discount, tax) => subtotal - discount + tax
);

export { selectCartDiscount };
