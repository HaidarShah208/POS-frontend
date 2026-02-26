import { createSlice } from "@reduxjs/toolkit";
import type { KitchenOrder, KitchenOrderStatus } from "@/types/api";

const initialState: { orders: KitchenOrder[] } = {
  orders: [],
};

const kitchenSlice = createSlice({
  name: "kitchen",
  initialState,
  reducers: {
    addOrder(state, action: { payload: KitchenOrder }) {
      state.orders.unshift(action.payload);
    },
    updateOrderStatus(state, action: { payload: { orderId: string; status: KitchenOrderStatus } }) {
      const order = state.orders.find((o) => o.id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status;
        order.updatedAt = new Date().toISOString();
      }
    },
    setOrders(state, action: { payload: KitchenOrder[] }) {
      state.orders = action.payload;
    },
  },
});

export const { addOrder, updateOrderStatus, setOrders } = kitchenSlice.actions;
export default kitchenSlice.reducer;
