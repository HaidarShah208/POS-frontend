import { baseApi } from "./baseApi";
import type {
  PurchaseOrder,
  PaginatedResponse,
  GetPurchaseOrdersParams,
  CreatePurchaseOrderInput,
  ReceiveItemsInput,
} from "@/types/api/index";

export const purchaseOrdersEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<PaginatedResponse<PurchaseOrder>, GetPurchaseOrdersParams | void>({
      query: (params) => ({ url: "/purchase-orders", params: params ?? {} }),
      providesTags: ["PurchaseOrders"],
    }),
    getPurchaseOrderById: builder.query<PurchaseOrder, string>({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "PurchaseOrders", id }],
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrderInput>({
      query: (body) => ({ url: "/purchase-orders", method: "POST", body }),
      invalidatesTags: ["PurchaseOrders"],
    }),
    receiveItems: builder.mutation<PurchaseOrder, { id: string; data: ReceiveItemsInput }>({
      query: ({ id, data }) => ({ url: `/purchase-orders/${id}/receive`, method: "POST", body: data }),
      invalidatesTags: ["PurchaseOrders", "Inventory", "InventorySummary", "StockMovements"],
    }),
    cancelPurchaseOrder: builder.mutation<void, string>({
      query: (id) => ({ url: `/purchase-orders/${id}/cancel`, method: "PATCH" }),
      invalidatesTags: ["PurchaseOrders"],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useReceiveItemsMutation,
  useCancelPurchaseOrderMutation,
} = purchaseOrdersEndpoints;
