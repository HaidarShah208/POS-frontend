import { baseApi } from "./baseApi";
import type { Customer } from "@/types/api/index";

/**
 * Customers API — backend may not implement these yet; endpoints will 404 until added.
 */
export const customersEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], void>({
      query: () => "/customers",
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: "Customers" as const, id })), "Customers"] : ["Customers"],
    }),
    createCustomer: builder.mutation<Customer, Partial<Customer> & { name: string }>({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      invalidatesTags: ["Customers"],
    }),
  }),
});

export const { useGetCustomersQuery, useCreateCustomerMutation } = customersEndpoints;
