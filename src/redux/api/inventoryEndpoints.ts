import { baseApi } from "./baseApi";
import type {
  InventoryItem,
  NewInventoryItem,
  PaginatedResponse,
  GetInventoryParams,
  AdjustStockRequest,
  GetNewInventoryParams,
  InventorySummary,
  StockMovement,
  GetStockMovementsParams,
  AdjustStockInput,
  RecordWasteInput,
  CreateInventoryItemInput,
} from "@/types/api/index";

export const inventoryEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventory: builder.query<PaginatedResponse<InventoryItem>, GetInventoryParams | void>({
      query: (params) => ({ url: "/inventory", params: params ?? {} }),
      providesTags: ["Inventory"],
    }),
    getInventoryByBranch: builder.query<PaginatedResponse<InventoryItem>, { branchId: string } & GetInventoryParams>({
      query: ({ branchId, ...params }) => ({ url: `/inventory/branch/${branchId}`, params }),
      providesTags: ["Inventory"],
    }),
    adjustStock: builder.mutation<InventoryItem, AdjustStockRequest>({
      query: (body) => ({ url: "/inventory/adjust", method: "POST", body }),
      invalidatesTags: ["Inventory"],
    }),

    getInventoryItems: builder.query<PaginatedResponse<NewInventoryItem>, GetNewInventoryParams | void>({
      query: (params) => ({ url: "/inventory", params: params ?? {} }),
      providesTags: ["Inventory"],
    }),
    getInventoryItemById: builder.query<NewInventoryItem, string>({
      query: (id) => `/inventory/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Inventory", id }],
    }),
    getInventorySummary: builder.query<InventorySummary, void>({
      query: () => "/inventory/summary",
      providesTags: ["InventorySummary"],
    }),
    getLowStockItems: builder.query<NewInventoryItem[], void>({
      query: () => "/inventory/low-stock",
      providesTags: ["Inventory"],
    }),
    getStockMovements: builder.query<PaginatedResponse<StockMovement>, GetStockMovementsParams | void>({
      query: (params) => ({ url: "/inventory/movements", params: params ?? {} }),
      providesTags: ["StockMovements"],
    }),
    getItemHistory: builder.query<PaginatedResponse<StockMovement>, { itemId: string; page?: number; limit?: number }>({
      query: ({ itemId, ...params }) => ({ url: `/inventory/${itemId}/history`, params }),
      providesTags: (_r, _e, { itemId }) => [{ type: "StockMovements", id: itemId }],
    }),
    createInventoryItem: builder.mutation<NewInventoryItem, CreateInventoryItemInput>({
      query: (body) => ({ url: "/inventory", method: "POST", body }),
      invalidatesTags: ["Inventory", "InventorySummary"],
    }),
    updateInventoryItem: builder.mutation<NewInventoryItem, { id: string; data: Partial<CreateInventoryItemInput> }>({
      query: ({ id, data }) => ({ url: `/inventory/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Inventory", "InventorySummary"],
    }),
    deleteInventoryItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/inventory/${id}`, method: "DELETE" }),
      invalidatesTags: ["Inventory", "InventorySummary"],
    }),
    adjustNewStock: builder.mutation<NewInventoryItem, AdjustStockInput>({
      query: (body) => ({ url: "/inventory/adjust", method: "POST", body }),
      invalidatesTags: ["Inventory", "InventorySummary", "StockMovements"],
    }),
    recordWaste: builder.mutation<void, RecordWasteInput>({
      query: (body) => ({ url: "/inventory/waste", method: "POST", body }),
      invalidatesTags: ["Inventory", "InventorySummary", "StockMovements"],
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useGetInventoryByBranchQuery,
  useAdjustStockMutation,
  useGetInventoryItemsQuery,
  useGetInventoryItemByIdQuery,
  useGetInventorySummaryQuery,
  useGetLowStockItemsQuery,
  useGetStockMovementsQuery,
  useGetItemHistoryQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useAdjustNewStockMutation,
  useRecordWasteMutation,
} = inventoryEndpoints;
