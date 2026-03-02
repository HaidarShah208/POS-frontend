import { baseApi } from "./baseApi";
import type { InventoryItem, PaginatedResponse, GetInventoryParams, AdjustStockRequest } from "@/types/api/index";

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
  }),
});

export const { useGetInventoryQuery, useGetInventoryByBranchQuery, useAdjustStockMutation } = inventoryEndpoints;
