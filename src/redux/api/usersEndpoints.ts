import { baseApi } from "./baseApi";
import type { User } from "@/types/api/index";

export const usersEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrgUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: (result) =>
        result
          ? [...result.map((u) => ({ type: "Users" as const, id: u.id })), { type: "Users", id: "LIST" }]
          : [{ type: "Users", id: "LIST" }],
    }),
    deleteUser: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
  }),
});

export const { useGetOrgUsersQuery, useDeleteUserMutation } = usersEndpoints;
