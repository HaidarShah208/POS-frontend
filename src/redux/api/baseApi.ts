import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./auth";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.API_URL ||
  "";

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

const rawBaseQuery = fetchBaseQuery({
    baseUrl: BACKEND_ORIGIN ? `${normalizeOrigin(BACKEND_ORIGIN)}/api` : "/api",
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
  if (!BACKEND_ORIGIN && typeof window !== "undefined") {
    // When BACKEND_ORIGIN isn't available at build-time, requests fall back to `/api/*`.
    // Ensure the Next.js API proxy route exists in production deployments.
    // eslint-disable-next-line no-console
    console.warn("[api] NEXT_PUBLIC_API_URL is missing; using /api proxy on same origin.");
  }
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
