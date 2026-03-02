/**
 * API error handling helpers for RTK Query / fetchBaseQuery errors.
 * Use with mutation/query error results to show UI or redirect.
 */

export type ApiErrorStatus = 401 | 403 | 500 | "network" | "unknown";

export interface SerializedApiError {
  status: ApiErrorStatus;
  message: string;
}

/** Get HTTP status from RTK Query / fetchBaseQuery error */
export function getApiErrorStatus(error: unknown): ApiErrorStatus {
  if (!error || typeof error !== "object") return "unknown";
  const e = error as { status?: number | string; originalStatus?: number };
  const status = e.status ?? e.originalStatus;
  if (status === 401) return 401;
  if (status === 403) return 403;
  if (typeof status === "number" && status >= 500) return 500;
  if (status === "FETCH_ERROR" || status === "PARSING_ERROR") return "network";
  return "unknown";
}

/** Get user-facing message for status */
export function getApiErrorMessage(error: unknown): string {
  const status = getApiErrorStatus(error);
  switch (status) {
    case 401:
      return "Please sign in again.";
    case 403:
      return "Access denied.";
    case 500:
      return "Something went wrong. Please try again.";
    case "network":
      return "Network error. Check your connection.";
    default:
      return "An error occurred.";
  }
}

/** Normalize error for display (status + message) */
export function serializeApiError(error: unknown): SerializedApiError {
  return {
    status: getApiErrorStatus(error),
    message: getApiErrorMessage(error),
  };
}
