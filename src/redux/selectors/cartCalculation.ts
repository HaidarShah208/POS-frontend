import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { cartApi } from "@/redux/api/cart";

const selectCartResult = (state: RootState) =>
  cartApi.endpoints.getCart.select(undefined)(state);
const selectCartData = (state: RootState) => selectCartResult(state)?.data;

const selectCartState = (state: RootState) => selectCartData(state);
const selectCartItems = (state: RootState) => selectCartData(state)?.items ?? [];
const selectCartDiscount = (state: RootState) => selectCartData(state)?.discount ?? 0;
const selectCartDiscountType = (state: RootState) =>
  selectCartData(state)?.discountType ?? "fixed";

/** Item line total (price + modifiers) * quantity. Memoized on items reference. */
export const selectCartSubtotal = createSelector(
  [selectCartItems],
  (items) =>
    items.reduce((sum, item) => {
      const modTotal = item.modifiers?.reduce((acc, mod) => acc + mod.price, 0) ?? 0;
      return sum + (item.price + modTotal) * item.quantity;
    }, 0)
);

/** Discount amount in currency (percent applied to subtotal or fixed) */
export const selectDiscountAmount = createSelector(
  [selectCartSubtotal, selectCartDiscount, selectCartDiscountType],
  (subtotal, discount, type) =>
    type === "percent" ? (subtotal * Math.min(100, Math.max(0, discount))) / 100 : Math.max(0, discount)
);

const TAX_RATE = 0.08;

export const selectCartTax = createSelector(
  [selectCartSubtotal, selectDiscountAmount],
  (subtotal, discountAmount) => (subtotal - discountAmount) * TAX_RATE
);

export const selectCartGrandTotal = createSelector(
  [selectCartSubtotal, selectDiscountAmount, selectCartTax],
  (subtotal, discountAmount, tax) => subtotal - discountAmount + tax
);

/** Single selector for all totals — one subscription, one re-render when any total changes. */
export const selectCartTotals = createSelector(
  [
    selectCartSubtotal,
    selectCartTax,
    selectDiscountAmount,
    selectCartGrandTotal,
  ],
  (subtotal, tax, discountAmount, grandTotal) => ({
    subtotal,
    tax,
    discountAmount,
    grandTotal,
  })
);

/** Cart state needed for checkout (order type + payment). Memoized on cart API data. */
export const selectCartCheckoutMeta = createSelector(
  [selectCartState],
  (cart) => ({
    orderType: cart?.orderType ?? "dine-in",
    paymentMethod: cart?.paymentMethod ?? "cash",
  })
);

export { selectCartDiscount };
export const selectCartOrderType = (state: RootState) =>
  selectCartData(state)?.orderType ?? "dine-in";
export const selectCartPaymentMethod = (state: RootState) =>
  selectCartData(state)?.paymentMethod ?? "cash";
