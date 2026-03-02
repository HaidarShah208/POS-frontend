import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./api/baseApi";
import "./api/authEndpoints";
import "./api/productsEndpoints";
import "./api/inventoryEndpoints";
import "./api/ordersEndpoints";
import "./api/branchesEndpoints";
import "./api/customersEndpoints";
import { cartApi } from "./api/cart";
import { reportsApi } from "./api/reports/reportsApi";
import { authReducer } from "./api/auth";
import { settingsReducer } from "./slices/settingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [cartApi.reducerPath]: cartApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      baseApi.middleware,
      cartApi.middleware,
      reportsApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
