import { createApi } from "@reduxjs/toolkit/query/react";
import type { AdminProduct, AdminCategory } from "@/types/admin";
import { MOCK_ADMIN_PRODUCTS, MOCK_ADMIN_CATEGORIES } from "@/lib/mock-admin-data";

let products = [...MOCK_ADMIN_PRODUCTS];
let categories = [...MOCK_ADMIN_CATEGORIES];

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: () => ({ data: null }),
  tagTypes: ["Products", "Categories"],
  endpoints: (builder) => ({
    getProducts: builder.query<AdminProduct[], void>({
      queryFn: () => ({ data: products.map((p) => ({ ...p, modifiers: p.modifiers ? [...p.modifiers] : [] })) }),
      providesTags: ["Products"],
    }),
    getProductById: builder.query<AdminProduct | null, string>({
      queryFn: (id) => {
        const p = products.find((x) => x.id === id);
        return { data: p ? { ...p, modifiers: p.modifiers ? [...p.modifiers] : [] } : null };
      },
      providesTags: (_r, _e, id) => [{ type: "Products", id }],
    }),
    createProduct: builder.mutation<AdminProduct, Omit<AdminProduct, "id">>({
      queryFn: (body) => {
        const newProduct: AdminProduct = {
          ...body,
          id: "p-" + Date.now(),
          modifiers: body.modifiers ? [...body.modifiers] : [],
        };
        products = [newProduct, ...products];
        return { data: newProduct };
      },
      invalidatesTags: ["Products"],
    }),
    updateProduct: builder.mutation<AdminProduct, AdminProduct>({
      queryFn: (body) => {
        const i = products.findIndex((p) => p.id === body.id);
        if (i >= 0) products[i] = { ...body, modifiers: body.modifiers ? [...body.modifiers] : [] };
        return { data: body };
      },
      invalidatesTags: ["Products"],
    }),
    deleteProduct: builder.mutation<null, string>({
      queryFn: (id) => {
        products = products.filter((p) => p.id !== id);
        return { data: null };
      },
      invalidatesTags: ["Products"],
    }),
    getCategories: builder.query<AdminCategory[], void>({
      queryFn: () => ({ data: categories.map((c) => ({ ...c })) }),
      providesTags: ["Categories"],
    }),
    createCategory: builder.mutation<AdminCategory, Omit<AdminCategory, "id">>({
      queryFn: (body) => {
        const newCat: AdminCategory = { ...body, id: "cat-" + Date.now() };
        categories = [newCat, ...categories].sort((a, b) => a.sortOrder - b.sortOrder);
        return { data: newCat };
      },
      invalidatesTags: ["Categories"],
    }),
    updateCategory: builder.mutation<AdminCategory, AdminCategory>({
      queryFn: (body) => {
        const i = categories.findIndex((c) => c.id === body.id);
        if (i >= 0) categories[i] = { ...body };
        return { data: body };
      },
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation<null, string>({
      queryFn: (id) => {
        categories = categories.filter((c) => c.id !== id);
        return { data: null };
      },
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = productsApi;
