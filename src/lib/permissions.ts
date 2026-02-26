import type { UserRole } from "@/types/admin";

export type Permission =
  | "pos"
  | "orders"
  | "kitchen"
  | "products"
  | "inventory"
  | "reports"
  | "staff"
  | "dashboard";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ["dashboard", "pos", "orders", "kitchen", "products", "inventory", "reports", "staff"],
  cashier: ["dashboard", "pos", "orders"],
  kitchen: ["kitchen"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const list = ROLE_PERMISSIONS[role];
  return list ? list.includes(permission) : false;
}

export type NavItem = { href: string; label: string; permission: Permission };

const ALL_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", permission: "dashboard" },
  { href: "/pos", label: "POS", permission: "pos" },
  { href: "/kitchen", label: "Kitchen", permission: "kitchen" },
  { href: "/products", label: "Products", permission: "products" },
  { href: "/inventory", label: "Inventory", permission: "inventory" },
  { href: "/reports", label: "Reports", permission: "reports" },
  { href: "/orders", label: "Orders", permission: "orders" },
  { href: "/staff", label: "Staff", permission: "staff" },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return ALL_NAV.filter((item) => hasPermission(role, item.permission));
}
