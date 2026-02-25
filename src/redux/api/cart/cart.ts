import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Cart API – RTK Query with tagTypes for cache invalidation.
 * BaseUrl: set when backend is ready (e.g. process.env.NEXT_PUBLIC_API_URL).
 */
export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: typeof window !== "undefined" ? "/api" : "",
  }),
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    submitOrder: builder.mutation<
      { orderId: string },
      { items: Array<{ productId: string; quantity: number }>; total: number }
    >({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const { useSubmitOrderMutation } = cartApi;
