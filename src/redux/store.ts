import { configureStore } from "@reduxjs/toolkit";
import { cartApi } from "./api/cart";
import { kitchenApi } from "./api/kitchen";
import { orderSessionApi } from "./api/orderSession";
import { productsApi } from "./api/products";
import { inventoryApi } from "./api/inventory";
import { reportsApi } from "./api/reports";
import { onlineOrdersApi } from "./api/onlineOrders";
import { authReducer } from "./api/auth";
import { settingsReducer } from "./slices/settingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    [cartApi.reducerPath]: cartApi.reducer,
    [onlineOrdersApi.reducerPath]: onlineOrdersApi.reducer,
    [kitchenApi.reducerPath]: kitchenApi.reducer,
    [orderSessionApi.reducerPath]: orderSessionApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      cartApi.middleware,
      kitchenApi.middleware,
      orderSessionApi.middleware,
      productsApi.middleware,
      inventoryApi.middleware,
      reportsApi.middleware,
      onlineOrdersApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
