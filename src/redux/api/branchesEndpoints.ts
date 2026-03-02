import { baseApi } from "./baseApi";
import type { Branch } from "@/types/api/index";

export const branchesEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<Branch[], void>({
      query: () => "/branches",
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: "Branches" as const, id })), "Branches"] : ["Branches"],
    }),
    getBranchById: builder.query<Branch, string>({
      query: (id) => `/branches/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Branches", id }],
    }),
    createBranch: builder.mutation<Branch, Partial<Branch> & { name: string }>({
      query: (body) => ({ url: "/branches", method: "POST", body }),
      invalidatesTags: ["Branches"],
    }),
  }),
});

export const { useGetBranchesQuery, useGetBranchByIdQuery, useCreateBranchMutation } = branchesEndpoints;
