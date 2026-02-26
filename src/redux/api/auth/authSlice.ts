import { createSlice } from "@reduxjs/toolkit";
import type { AuthUser, UserRole } from "@/types/admin";

const MOCK_USER: AuthUser = {
  id: "u1",
  email: "admin@pos.com",
  name: "Admin User",
  role: "admin",
};

const initialState: { user: AuthUser | null } = {
  user: MOCK_USER,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: { payload: AuthUser | null }) {
      state.user = action.payload;
    },
    setRole(state, action: { payload: UserRole }) {
      if (state.user) state.user.role = action.payload;
    },
    logout(state) {
      state.user = null;
    },
  },
});

export const { setUser, setRole, logout } = authSlice.actions;
export default authSlice.reducer;
