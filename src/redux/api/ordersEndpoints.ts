import { baseApi } from "./baseApi";
import type {
  Order,
  PaginatedResponse,
  GetOrdersParams,
  PlaceOrderRequest,
  PlaceOrderResponse,
  OrderStatus,
  KitchenOrderStatus,
} from "@/types/api/index";

export const ordersEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<PaginatedResponse<Order>, GetOrdersParams | void>({
      query: (params) => ({ url: "/orders", params: params ?? {} }),
      providesTags: ["Orders"],
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Orders", id }],
    }),
    placeOrder: builder.mutation<PlaceOrderResponse, PlaceOrderRequest>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Orders", "Kitchen"],
    }),
    updateOrderStatus: builder.mutation<void, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({ url: `/orders/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Orders", "Kitchen"],
    }),
    getOrdersByBranch: builder.query<Order[], string>({
      query: (branchId) => `/orders/branch/${branchId}`,
      providesTags: ["Orders"],
    }),
    getKitchenOrders: builder.query<Order[], string>({
      query: (branchId) => `/orders/kitchen/${branchId}`,
      providesTags: ["Kitchen"],
    }),
    updateKitchenOrderStatus: builder.mutation<void, { orderId: string; status: KitchenOrderStatus }>({
      query: (body) => ({ url: "/orders/kitchen/status", method: "PATCH", body }),
      invalidatesTags: ["Kitchen", "Orders"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  usePlaceOrderMutation,
  useUpdateOrderStatusMutation,
  useGetOrdersByBranchQuery,
  useGetKitchenOrdersQuery,
  useUpdateKitchenOrderStatusMutation,
} = ordersEndpoints;
