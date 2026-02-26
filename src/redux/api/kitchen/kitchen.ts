import { createApi } from "@reduxjs/toolkit/query/react";
import type { KitchenOrder, KitchenOrderStatus } from "@/types/api";

let orders: KitchenOrder[] = [];

export const kitchenApi = createApi({
  reducerPath: "kitchenApi",
  baseQuery: () => ({ data: null }),
  tagTypes: ["KitchenOrders"],
  endpoints: (builder) => ({
    getKitchenOrders: builder.query<KitchenOrder[], void>({
      queryFn: () => ({ data: [...orders] }),
      providesTags: ["KitchenOrders"],
    }),
    addOrder: builder.mutation<KitchenOrder[], KitchenOrder>({
      queryFn: (order) => {
        orders = [order, ...orders];
        return { data: [...orders] };
      },
      invalidatesTags: ["KitchenOrders"],
    }),
    updateOrderStatus: builder.mutation<
      void,
      { orderId: string; status: KitchenOrderStatus }
    >({
      queryFn: ({ orderId, status }) => {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          order.status = status;
          order.updatedAt = new Date().toISOString();
        }
        return { data: undefined };
      },
      invalidatesTags: ["KitchenOrders"],
    }),
  }),
});

export const {
  useGetKitchenOrdersQuery,
  useAddOrderMutation,
  useUpdateOrderStatusMutation,
} = kitchenApi;
