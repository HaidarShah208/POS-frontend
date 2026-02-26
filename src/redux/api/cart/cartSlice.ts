import { createSlice } from "@reduxjs/toolkit";
import type { CartItem, CartState, AddToCartPayload, CartItemModifier } from "@/types";

const initialState: CartState = {
  items: [],
  totalQuantity: 0,
  discount: 0,
  discountType: "fixed",
  orderType: "dine-in",
  paymentMethod: "cash",
};

function recalcQuantity(state: CartState) {
  state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: { payload: AddToCartPayload }) {
      const { productId, name, price, image, quantity = 1, note, modifiers } = action.payload;
      const existing = state.items.find((i) => i.productId === productId && !i.note && !(i.modifiers?.length));
      if (existing && !note && !(modifiers?.length)) {
        existing.quantity += quantity;
      } else {
        state.items.push({
          id: `cart-${productId}-${Date.now()}`,
          productId,
          name,
          price,
          quantity,
          image,
          note,
          modifiers: modifiers?.length ? [...modifiers] : undefined,
        });
      }
      recalcQuantity(state);
    },
    removeFromCart(state, action: { payload: string }) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      recalcQuantity(state);
    },
    increaseQty(state, action: { payload: string }) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        item.quantity += 1;
        recalcQuantity(state);
      }
    },
    decreaseQty(state, action: { payload: string }) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        if (item.quantity <= 1) {
          state.items = state.items.filter((i) => i.id !== action.payload);
        } else {
          item.quantity -= 1;
        }
        recalcQuantity(state);
      }
    },
    setItemNote(state, action: { payload: { itemId: string; note: string } }) {
      const item = state.items.find((i) => i.id === action.payload.itemId);
      if (item) item.note = action.payload.note || undefined;
    },
    setItemModifiers(state, action: { payload: { itemId: string; modifiers: CartItemModifier[] } }) {
      const item = state.items.find((i) => i.id === action.payload.itemId);
      if (item) item.modifiers = action.payload.modifiers?.length ? action.payload.modifiers : undefined;
    },
    setDiscount(state, action: { payload: number }) {
      state.discount = Math.max(0, action.payload);
    },
    setDiscountType(state, action: { payload: CartState["discountType"] }) {
      state.discountType = action.payload;
    },
    setOrderType(state, action: { payload: CartState["orderType"] }) {
      state.orderType = action.payload;
    },
    setPaymentMethod(state, action: { payload: CartState["paymentMethod"] }) {
      state.paymentMethod = action.payload;
    },
    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
      state.discount = 0;
      state.discountType = "fixed";
      state.orderType = "dine-in";
      state.paymentMethod = "cash";
    },
  },
});

export const {
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
} = cartSlice.actions;
export default cartSlice.reducer;
