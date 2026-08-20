import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./api/baseApi";
import "./api/authEndpoints";
import "./api/productsEndpoints";
import "./api/inventoryEndpoints";
import "./api/ordersEndpoints";
import "./api/branchesEndpoints";
import "./api/customersEndpoints";
import "./api/suppliersEndpoints";
import "./api/adminEndpoints";
import "./api/rolesEndpoints";
import "./api/usersEndpoints";
import { cartApi } from "./api/cart";
import { authReducer } from "./api/auth";
import { settingsReducer } from "./slices/settingsSlice";
import { floorReducer } from "./slices/floorSlice";
import { loyaltyReducer } from "./slices/loyaltySlice";
import { purchaseOrderReducer } from "./slices/purchaseOrderSlice";
import { cashRegisterReducer } from "./slices/cashRegisterSlice";
import { rolesReducer } from "./slices/rolesSlice";
import { notificationReducer } from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    floor: floorReducer,
    loyalty: loyaltyReducer,
    purchaseOrders: purchaseOrderReducer,
    cashRegister: cashRegisterReducer,
    roles: rolesReducer,
    notifications: notificationReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [cartApi.reducerPath]: cartApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      baseApi.middleware,
      cartApi.middleware,
    ),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
