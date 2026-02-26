import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { PlaceOrderResponse, KitchenOrderStatus } from "@/types/api";
import type { CartItem, OrderType, PaymentMethod } from "@/types";
import { mockPlaceOrder } from "@/lib/mockOrderGenerator";

/** Request for placing an order (matches cart + totals) */
export interface PlaceOrderRequest {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

export const orderSessionApi = createApi({
  reducerPath: "orderSessionApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Order", "Kitchen"],
  endpoints: (builder) => ({
    placeOrder: builder.mutation<PlaceOrderResponse, PlaceOrderRequest>({
      queryFn: async (arg) => {
        const { orderId, token } = mockPlaceOrder();
        return { data: { orderId, token } };
      },
      invalidatesTags: ["Order", "Kitchen"],
    }),
    updateKitchenOrderStatus: builder.mutation<void, { orderId: string; status: KitchenOrderStatus }>({
      queryFn: async () => ({ data: undefined }),
      invalidatesTags: ["Kitchen"],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useUpdateKitchenOrderStatusMutation,
} = orderSessionApi;
