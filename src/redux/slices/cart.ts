import { createSlice } from "@reduxjs/toolkit";
import type { CartItem } from "@/types";

export interface CartState {
  items: CartItem[];
  totalQuantity: number;
  discount: number;
}

const initialState: CartState = {
  items: [],
  totalQuantity: 0,
  discount: 0,
};

function recalcQuantity(state: CartState) {
  state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: { payload: Omit<CartItem, "id" | "quantity"> & { quantity?: number } }) {
      const { productId, name, price, image, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({
          id: `cart-${productId}-${Date.now()}`,
          productId,
          name,
          price,
          quantity,
          image,
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
    setDiscount(state, action: { payload: number }) {
      state.discount = Math.max(0, action.payload);
    },
    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
      state.discount = 0;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  increaseQty,
  decreaseQty,
  setDiscount,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
