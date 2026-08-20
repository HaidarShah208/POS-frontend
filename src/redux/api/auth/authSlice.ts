import { createSlice } from "@reduxjs/toolkit";
import type { AuthUser, UserRole, SubscriptionState } from "@/types/admin";

const AUTH_STORAGE_KEY = "pos_auth";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  permissions: string[];
  subscription: SubscriptionState | null;
  _rehydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  permissions: [],
  subscription: null,
  _rehydrated: false,
};

function setAuthCookies(user: AuthUser | null) {
  if (typeof document === "undefined") return;
  if (user) {
    document.cookie = `pos_auth_exists=1;path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
    document.cookie = `pos_user_role=${user.role};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
  } else {
    document.cookie = "pos_auth_exists=;path=/;max-age=0";
    document.cookie = "pos_user_role=;path=/;max-age=0";
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: { payload: AuthUser | null }) {
      state.user = action.payload;
      if (!action.payload) {
        state.token = null;
        state.subscription = null;
      }
    },
    setCredentials(state, action: { payload: { user: AuthUser; token: string; permissions?: string[]; subscription?: SubscriptionState | null } | null }) {
      if (!action.payload) {
        state.user = null;
        state.token = null;
        state.permissions = [];
        state.subscription = null;
        return;
      }
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.permissions = action.payload.permissions ?? [];
      state.subscription = action.payload.subscription ?? null;
    },
    setRehydrated(state) {
      state._rehydrated = true;
    },
    setRole(state, action: { payload: UserRole }) {
      if (state.user) state.user.role = action.payload;
    },
    setSubscription(state, action: { payload: SubscriptionState | null }) {
      state.subscription = action.payload;
    },
    setPermissions(state, action: { payload: string[] }) {
      state.permissions = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.permissions = [];
      state.subscription = null;
    },
  },
});

export const { setUser, setRole, logout, setCredentials, setRehydrated, setSubscription, setPermissions } = authSlice.actions;

export function loadStoredAuth(): { user: AuthUser; token: string; permissions?: string[]; subscription?: SubscriptionState | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user: AuthUser; token: string; permissions?: string[]; subscription?: SubscriptionState | null };
    if (parsed?.user && parsed?.token) {
      setAuthCookies(parsed.user);
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveAuthToStorage(payload: { user: AuthUser; token: string; permissions?: string[]; subscription?: SubscriptionState | null } | null) {
  if (typeof window === "undefined") return;
  if (!payload) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthCookies(null);
    return;
  }
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    setAuthCookies(payload.user);
  } catch {
    // ignore
  }
}
export default authSlice.reducer;
