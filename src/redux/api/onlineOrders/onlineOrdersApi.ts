import { createApi } from "@reduxjs/toolkit/query/react";
import type { OnlineOrder, OnlineOrderStatus, OrderSource } from "@/types/online-orders";
import { getInitialOrders, generateMockOrder } from "@/lib/mock-online-orders";

let orders: OnlineOrder[] = getInitialOrders();

function addTimelineEntry(order: OnlineOrder, status: OnlineOrderStatus, label: string): void {
  const at = new Date().toISOString();
  order.timeline = [...order.timeline, { status, at, label }];
}

export const onlineOrdersApi = createApi({
  reducerPath: "onlineOrdersApi",
  baseQuery: () => ({ data: null }),
  tagTypes: ["OnlineOrders"],
  endpoints: (builder) => ({
    getOnlineOrders: builder.query<OnlineOrder[], void>({
      queryFn: () => ({ data: orders.map((o) => ({ ...o, items: [...o.items], timeline: [...o.timeline] })) }),
      providesTags: ["OnlineOrders"],
    }),
    updateOrderStatus: builder.mutation<OnlineOrder, { orderId: string; status: OnlineOrderStatus }>({
      queryFn: (arg) => {
        const order = orders.find((o) => o.id === arg.orderId);
        if (!order) return { error: { status: 404, data: "Not found" } };
        order.status = arg.status;
        const labels: Record<OnlineOrderStatus, string> = {
          pending: "Order placed",
          accepted: "Order accepted",
          preparing: "Preparing",
          out_for_delivery: "Out for delivery",
          delivered: "Delivered",
          rejected: "Rejected",
        };
        addTimelineEntry(order, arg.status, labels[arg.status]);
        return { data: { ...order, items: [...order.items], timeline: [...order.timeline] } };
      },
      invalidatesTags: ["OnlineOrders"],
    }),
    addMockOrder: builder.mutation<OnlineOrder, OrderSource>({
      queryFn: (source) => {
        const newOrder = generateMockOrder(source);
        orders = [newOrder, ...orders];
        return { data: { ...newOrder, items: [...newOrder.items], timeline: [...newOrder.timeline] } };
      },
      invalidatesTags: ["OnlineOrders"],
    }),
  }),
});

export const { useGetOnlineOrdersQuery, useUpdateOrderStatusMutation, useAddMockOrderMutation } = onlineOrdersApi;
