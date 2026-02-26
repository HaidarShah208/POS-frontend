import { configureStore } from "@reduxjs/toolkit";
import { cartApi, cartReducer } from "./api/cart";
import { kitchenReducer } from "./api/kitchen";
import { orderSessionApi } from "./api/orderSession";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    kitchen: kitchenReducer,
    [cartApi.reducerPath]: cartApi.reducer,
    [orderSessionApi.reducerPath]: orderSessionApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cartApi.middleware, orderSessionApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
