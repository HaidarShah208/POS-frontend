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
} from "./inventoryEndpoints";
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
export { customersEndpoints, useGetCustomersQuery, useCreateCustomerMutation } from "./customersEndpoints";

// Ensure all endpoint modules are loaded so they inject into baseApi
import "./authEndpoints";
import "./productsEndpoints";
import "./inventoryEndpoints";
import "./ordersEndpoints";
import "./branchesEndpoints";
import "./customersEndpoints";
