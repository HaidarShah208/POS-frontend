import { baseApi } from "./baseApi";
import type { Customer, GetCustomersParams, PaginatedResponse, CustomerOrder } from "@/types/api/index";

export const customersEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], GetCustomersParams | void>({
      query: (params) => ({ url: "/customers", params: params ?? {} }),
      transformResponse: (res: Customer[] | PaginatedResponse<Customer>) =>
        Array.isArray(res) ? res : res.data,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Customers" as const, id })), "Customers"]
          : ["Customers"],
    }),
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Customers", id }],
    }),
    createCustomer: builder.mutation<Customer, Partial<Customer> & { name: string }>({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      invalidatesTags: ["Customers"],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; data: Partial<Customer> }>({
      query: ({ id, data }) => ({ url: `/customers/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Customers", id }, "Customers"],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({ url: `/customers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Customers"],
    }),
    getCustomerOrders: builder.query<CustomerOrder[], string>({
      query: (customerId) => `/customers/${customerId}/orders`,
      transformResponse: (res: CustomerOrder[] | { data: CustomerOrder[] }) =>
        Array.isArray(res) ? res : res.data,
      providesTags: (_r, _e, customerId) => [{ type: "Orders", id: `customer-${customerId}` }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerOrdersQuery,
} = customersEndpoints;
