import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { SubmitOrderRequest, SubmitOrderResponse } from "@/types/api";

 
export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: typeof window !== "undefined" ? "/api" : "",
  }),
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    submitOrder: builder.mutation<SubmitOrderResponse, SubmitOrderRequest>({
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
