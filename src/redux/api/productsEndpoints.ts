import { baseApi } from "./baseApi";
import type { Product, Category, PaginatedResponse, GetProductsParams } from "@/types/api/index";

export const productsEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, GetProductsParams | void>({
      query: (params) => ({ url: "/products", params: params ?? {} }),
      providesTags: ["Products"],
    }),
    getProductById: builder.query<Product | null, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Products", id }],
    }),
    createProduct: builder.mutation<Product, Partial<Product> & { name: string; categoryId: string; price: number }>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["Products"],
    }),
    updateProduct: builder.mutation<Product, Product>({
      query: (body) => ({ url: `/products/${body.id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Products", id }],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Products"],
    }),
    getCategories: builder.query<Category[], void>({
      query: () => "/products/categories",
      providesTags: ["Categories"],
    }),
    getCategoryById: builder.query<Category, string>({
      query: (id) => `/products/categories/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Categories", id }],
    }),
    createCategory: builder.mutation<Category, Omit<Category, "id">>({
      query: (body) => ({ url: "/products/categories", method: "POST", body }),
      invalidatesTags: ["Categories"],
    }),
    updateCategory: builder.mutation<Category, Category>({
      query: (body) => ({ url: `/products/categories/${body.id}`, method: "PATCH", body }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/categories/${id}`, method: "DELETE" }),
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
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = productsEndpoints;

