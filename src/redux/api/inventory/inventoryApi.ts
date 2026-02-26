import { createApi } from "@reduxjs/toolkit/query/react";
import type { InventoryItem, StockAdjustment } from "@/types/admin";
import { getMockInventory, MOCK_STOCK_ADJUSTMENTS } from "@/lib/mock-admin-data";

let inventory: InventoryItem[] = getMockInventory();
const adjustmentsByProduct: Record<string, StockAdjustment[]> = {};
for (const a of MOCK_STOCK_ADJUSTMENTS) {
  if (!adjustmentsByProduct[a.productId]) adjustmentsByProduct[a.productId] = [];
  adjustmentsByProduct[a.productId].push(a);
}

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: () => ({ data: null }),
  tagTypes: ["Inventory", "Adjustments"],
  endpoints: (builder) => ({
    getInventory: builder.query<InventoryItem[], void>({
      queryFn: () => ({ data: inventory.map((i) => ({ ...i })) }),
      providesTags: ["Inventory"],
    }),
    adjustStock: builder.mutation<
      InventoryItem,
      { productId: string; type: "add" | "remove"; quantity: number; reason: string }
    >({
      queryFn: (arg) => {
        const idx = inventory.findIndex((i) => i.productId === arg.productId);
        if (idx < 0) return { error: { status: 404, data: "Not found" } };
        const item = inventory[idx];
        const delta = arg.type === "add" ? arg.quantity : -arg.quantity;
        const newStock = Math.max(0, item.currentStock + delta);
        const status =
          newStock <= 0 ? "out_of_stock" : newStock <= item.lowStockThreshold ? "low_stock" : "in_stock";
        inventory[idx] = {
          ...item,
          currentStock: newStock,
          stockValue: newStock * item.cost,
          status,
        };
        const adj: StockAdjustment = {
          id: `adj-${Date.now()}`,
          productId: arg.productId,
          type: arg.type,
          quantity: arg.quantity,
          reason: arg.reason,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        };
        if (!adjustmentsByProduct[arg.productId]) adjustmentsByProduct[arg.productId] = [];
        adjustmentsByProduct[arg.productId].unshift(adj);
        return { data: inventory[idx] };
      },
      invalidatesTags: ["Inventory", "Adjustments"],
    }),
    getStockHistory: builder.query<StockAdjustment[], string>({
      queryFn: (productId) => ({
        data: adjustmentsByProduct[productId] ?? [],
      }),
      providesTags: (_r, _e, id) => [{ type: "Adjustments", id }],
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useAdjustStockMutation,
  useGetStockHistoryQuery,
} = inventoryApi;
