export { cartApi, useSubmitOrderMutation } from "./cart";
export {
  addToCart,
  removeFromCart,
  increaseQty,
  decreaseQty,
  setItemNote,
  setItemModifiers,
  setDiscount,
  setDiscountType,
  setOrderType,
  setPaymentMethod,
  clearCart,
} from "./cartSlice";
export { default as cartReducer } from "./cartSlice";
