import { baseApi } from "./baseApi";
import type { AuthResponse, User, RegisterOrgInput } from "@/types/api/index";

export const authEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    register: builder.mutation<User, { name: string; email: string; password: string; role: string; branchId: string }>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["Auth", "Users"],
    }),
    registerOrganization: builder.mutation<AuthResponse, RegisterOrgInput>({
      query: (body) => ({ url: "/auth/register-organization", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useRegisterOrganizationMutation } = authEndpoints;
