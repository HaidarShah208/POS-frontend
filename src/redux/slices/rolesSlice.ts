import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RolesState } from "@/types/roles";
import type { Permission } from "@/lib/permissions";
import { loadFromStorage, saveToStorage } from "@/lib/localStorage";

const KEY = "pos-custom-roles";
const FALLBACK: RolesState = { customRoles: [] };

function persist(state: RolesState) { saveToStorage(KEY, state); }

const rolesSlice = createSlice({
  name: "roles",
  initialState: loadFromStorage(KEY, FALLBACK),
  reducers: {
    addCustomRole(state, action: PayloadAction<{ name: string; description: string; permissions: Permission[] }>) {
      const { name, description, permissions } = action.payload;
      state.customRoles.push({
        id: `role-${Date.now()}`,
        name,
        description,
        permissions,
        isSystem: false,
        createdAt: new Date().toISOString(),
      });
      persist(state);
    },
    updateCustomRole(state, action: PayloadAction<{ id: string; name?: string; description?: string; permissions?: Permission[] }>) {
      const role = state.customRoles.find((r) => r.id === action.payload.id);
      if (role) {
        if (action.payload.name !== undefined) role.name = action.payload.name;
        if (action.payload.description !== undefined) role.description = action.payload.description;
        if (action.payload.permissions !== undefined) role.permissions = action.payload.permissions;
        persist(state);
      }
    },
    deleteCustomRole(state, action: PayloadAction<string>) {
      state.customRoles = state.customRoles.filter((r) => r.id !== action.payload);
      persist(state);
    },
  },
});

export const { addCustomRole, updateCustomRole, deleteCustomRole } = rolesSlice.actions;
export const rolesReducer = rolesSlice.reducer;
