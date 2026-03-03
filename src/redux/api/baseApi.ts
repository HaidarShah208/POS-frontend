import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./auth";

const baseUrl =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || ""
    : process.env.NEXT_PUBLIC_API_URL || "";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: baseUrl ? `${baseUrl.replace(/\/$/, "")}/api` : "/api",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth?: { token?: string | null } };
      const token = state.auth?.token ?? null;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  });

async function baseQueryWithAuth(
  args: Parameters<typeof rawBaseQuery>[0],
  api: Parameters<typeof rawBaseQuery>[1],
  extra: Parameters<typeof rawBaseQuery>[2]
) {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401) {
    api.dispatch(logout());
    if (typeof window !== "undefined") window.location.href = "/auth/login";
  }
  return result;
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "Auth",
    "Products",
    "Categories",
    "Inventory",
    "Orders",
    "Kitchen",
    "Branches",
    "Customers",
    "Reports",
  ],
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
