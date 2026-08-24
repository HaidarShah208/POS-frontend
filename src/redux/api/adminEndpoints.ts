import { baseApi } from "./baseApi";
import type { PlatformStats, Organization } from "@/types/api/index";
import type { PaymentSubmission } from "./subscriptionEndpoints";

interface PaginatedOrgs {
  data: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformStats: builder.query<PlatformStats, void>({
      query: () => "/admin/stats",
      providesTags: ["PlatformStats"],
    }),
    getOrganizations: builder.query<PaginatedOrgs, { page?: number; limit?: number; search?: string; status?: string }>({
      query: (params) => ({
        url: "/admin/organizations",
        params,
      }),
      providesTags: ["Organizations"],
    }),
    getOrganizationById: builder.query<Organization & { users: unknown[]; stats: { totalOrders: number; totalRevenue: number; totalUsers: number } }, string>({
      query: (id) => `/admin/organizations/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Organizations", id }],
    }),
    updateOrganization: builder.mutation<Organization, { id: string; data: Partial<Organization> }>({
      query: ({ id, data }) => ({
        url: `/admin/organizations/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Organizations", "PlatformStats"],
    }),
    updateOrganizationStatus: builder.mutation<Organization, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/admin/organizations/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Organizations", "PlatformStats"],
    }),
    getOrganizationPayments: builder.query<PaymentSubmission[], string>({
      query: (id) => `/admin/organizations/${id}/payments`,
      providesTags: (_r, _e, id) => [{ type: "Organizations", id }],
    }),
  }),
});

export const {
  useGetPlatformStatsQuery,
  useGetOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
  useUpdateOrganizationStatusMutation,
  useGetOrganizationPaymentsQuery,
} = adminEndpoints;
