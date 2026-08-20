import { baseApi } from "./baseApi";
import type { RoleDefinition, CreateRoleInput, UpdateRoleInput } from "@/types/api/index";

export const rolesEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<RoleDefinition[], void>({
      query: () => "/roles",
      providesTags: (result) =>
        result
          ? [...result.map((r) => ({ type: "Roles" as const, id: r.id })), { type: "Roles", id: "LIST" }]
          : [{ type: "Roles", id: "LIST" }],
    }),
    getRoleById: builder.query<RoleDefinition, string>({
      query: (id) => `/roles/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Roles", id }],
    }),
    createRole: builder.mutation<RoleDefinition, CreateRoleInput>({
      query: (body) => ({ url: "/roles", method: "POST", body }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
    updateRole: builder.mutation<RoleDefinition, { id: string } & UpdateRoleInput>({
      query: ({ id, ...body }) => ({ url: `/roles/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Roles", id }, { type: "Roles", id: "LIST" }],
    }),
    deleteRole: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/roles/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesEndpoints;
