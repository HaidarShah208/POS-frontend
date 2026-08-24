export { baseApi } from "./baseApi";
export { authEndpoints, useLoginMutation, useRegisterMutation } from "./authEndpoints";
export {
  productsEndpoints,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "./productsEndpoints";
export {
  inventoryEndpoints,
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
} from "./inventoryEndpoints";
export {
  recipesEndpoints,
  useGetRecipesQuery,
  useGetRecipeByIdQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} from "./recipesEndpoints";
export {
  purchaseOrdersEndpoints,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useReceiveItemsMutation,
  useCancelPurchaseOrderMutation,
} from "./purchaseOrdersEndpoints";
export {
  ordersEndpoints,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  usePlaceOrderMutation,
  useUpdateOrderStatusMutation,
  useGetOrdersByBranchQuery,
  useGetKitchenOrdersQuery,
  useUpdateKitchenOrderStatusMutation,
} from "./ordersEndpoints";
export {
  branchesEndpoints,
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
} from "./branchesEndpoints";
export {
  suppliersEndpoints,
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierPurchasesQuery,
} from "./suppliersEndpoints";

import "./authEndpoints";
import "./productsEndpoints";
import "./inventoryEndpoints";
import "./ordersEndpoints";
import "./branchesEndpoints";
import "./suppliersEndpoints";
import "./recipesEndpoints";
import "./purchaseOrdersEndpoints";
