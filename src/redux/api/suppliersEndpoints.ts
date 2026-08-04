import { baseApi } from "./baseApi";
import type { Supplier, GetSuppliersParams, PaginatedResponse, SupplierPurchase } from "@/types/api/index";

export const suppliersEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<Supplier[], GetSuppliersParams | void>({
      query: (params) => ({ url: "/suppliers", params: params ?? {} }),
      transformResponse: (res: Supplier[] | PaginatedResponse<Supplier>) =>
        Array.isArray(res) ? res : res.data,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Suppliers" as const, id })), "Suppliers"]
          : ["Suppliers"],
    }),
    getSupplierById: builder.query<Supplier, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Suppliers", id }],
    }),
    createSupplier: builder.mutation<Supplier, Partial<Supplier> & { name: string }>({
      query: (body) => ({ url: "/suppliers", method: "POST", body }),
      invalidatesTags: ["Suppliers"],
    }),
    updateSupplier: builder.mutation<Supplier, { id: string; data: Partial<Supplier> }>({
      query: ({ id, data }) => ({ url: `/suppliers/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Suppliers", id }, "Suppliers"],
    }),
    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Suppliers"],
    }),
    getSupplierPurchases: builder.query<SupplierPurchase[], string>({
      query: (supplierId) => `/suppliers/${supplierId}/purchases`,
      transformResponse: (res: SupplierPurchase[] | { data: SupplierPurchase[] }) =>
        Array.isArray(res) ? res : res.data,
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierPurchasesQuery,
} = suppliersEndpoints;
