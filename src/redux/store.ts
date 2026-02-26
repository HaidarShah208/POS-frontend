import { configureStore } from "@reduxjs/toolkit";
import { cartApi } from "./api/cart";
import { kitchenApi } from "./api/kitchen";
import { orderSessionApi } from "./api/orderSession";

export const store = configureStore({
  reducer: {
    [cartApi.reducerPath]: cartApi.reducer,
    [kitchenApi.reducerPath]: kitchenApi.reducer,
    [orderSessionApi.reducerPath]: orderSessionApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      cartApi.middleware,
      kitchenApi.middleware,
      orderSessionApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
