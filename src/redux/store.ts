import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cart";
import { cartApi } from "./api/cart";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    [cartApi.reducerPath]: cartApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cartApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
