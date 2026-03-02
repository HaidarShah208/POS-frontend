import { createSlice } from "@reduxjs/toolkit";
import type { AuthUser, UserRole } from "@/types/admin";

const AUTH_STORAGE_KEY = "pos_auth";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  _rehydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  _rehydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: { payload: AuthUser | null }) {
      state.user = action.payload;
      if (!action.payload) state.token = null;
    },
    setCredentials(state, action: { payload: { user: AuthUser; token: string } | null }) {
      if (!action.payload) {
        state.user = null;
        state.token = null;
        return;
      }
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setRehydrated(state) {
      state._rehydrated = true;
    },
    setRole(state, action: { payload: UserRole }) {
      if (state.user) state.user.role = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setUser, setRole, logout, setCredentials, setRehydrated } = authSlice.actions;

export function loadStoredAuth(): { user: AuthUser; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
    if (parsed?.user && parsed?.token) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export function saveAuthToStorage(payload: { user: AuthUser; token: string } | null) {
  if (typeof window === "undefined") return;
  if (!payload) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}
export default authSlice.reducer;
