import type { Permission } from "@/lib/permissions";

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
}

export interface RolesState {
  customRoles: RoleDefinition[];
}
