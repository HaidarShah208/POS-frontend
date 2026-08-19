import type { UserRole } from "@/types/admin";

export type Permission =
  | "pos"
  | "orders"
  | "online_orders"
  | "settings"
  | "kitchen"
  | "products"
  | "inventory"
  | "reports"
  | "staff"
  | "dashboard"
  | "floor"
  | "customers"
  | "loyalty"
  | "suppliers"
  | "purchase_orders"
  | "cash_register"
  | "employees"
  | "roles"
  | "analytics"
  | "admin_panel";

export const ALL_PERMISSIONS: { id: Permission; label: string; group: string }[] = [
  { id: "dashboard", label: "Dashboard", group: "Core" },
  { id: "pos", label: "Sales Counter", group: "Core" },
  { id: "orders", label: "Orders", group: "Core" },
  { id: "kitchen", label: "Kitchen Display", group: "Core" },
  { id: "products", label: "Products", group: "Catalog" },
  { id: "inventory", label: "Inventory", group: "Catalog" },
  { id: "suppliers", label: "Suppliers", group: "Catalog" },
  { id: "purchase_orders", label: "Purchase Orders", group: "Catalog" },
  { id: "floor", label: "Floor Plan", group: "Operations" },
  { id: "customers", label: "Customers", group: "Operations" },
  { id: "loyalty", label: "Loyalty", group: "Operations" },
  { id: "cash_register", label: "Cash Register", group: "Operations" },
  { id: "employees", label: "Employees", group: "Management" },
  { id: "reports", label: "Reports", group: "Management" },
  { id: "analytics", label: "Analytics", group: "Management" },
  { id: "roles", label: "Roles & Permissions", group: "Management" },
  { id: "settings", label: "Settings", group: "Management" },
  { id: "online_orders", label: "Online Orders", group: "Management" },
  { id: "staff", label: "Staff", group: "Management" },
  { id: "admin_panel", label: "Admin Panel", group: "Platform" },
];

export const SYSTEM_ROLES: { id: UserRole; label: string; description: string; permissions: Permission[] }[] = [
  {
    id: "super_admin",
    label: "Super Admin",
    description: "Platform-level access to manage all organizations",
    permissions: ["admin_panel", "dashboard"],
  },
  {
    id: "owner",
    label: "Owner",
    description: "Full access to their restaurant organization",
    permissions: ALL_PERMISSIONS.filter((p) => p.id !== "admin_panel").map((p) => p.id),
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full access to all features and settings",
    permissions: ALL_PERMISSIONS.filter((p) => p.id !== "admin_panel").map((p) => p.id),
  },
  {
    id: "cashier",
    label: "Cashier",
    description: "Access to POS, orders, floor, customers, loyalty, and cash register",
    permissions: ["dashboard", "pos", "orders", "floor", "customers", "loyalty", "cash_register"],
  },
  {
    id: "kitchen",
    label: "Kitchen Staff",
    description: "Access to kitchen display only",
    permissions: ["kitchen"],
  },
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: ["admin_panel", "dashboard"],
  owner: ALL_PERMISSIONS.filter((p) => p.id !== "admin_panel").map((p) => p.id),
  admin: ALL_PERMISSIONS.filter((p) => p.id !== "admin_panel").map((p) => p.id),
  cashier: ["dashboard", "pos", "orders", "floor", "customers", "loyalty", "cash_register"],
  kitchen: ["kitchen"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const list = ROLE_PERMISSIONS[role];
  return list ? list.includes(permission) : false;
}

export type NavItem = { href: string; label: string; permission: Permission };

const ALL_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", permission: "dashboard" },
  { href: "/pos", label: "Sales Counter", permission: "pos" },
  { href: "/kitchen", label: "Kitchen", permission: "kitchen" },
  { href: "/products", label: "Products", permission: "products" },
  { href: "/inventory", label: "Inventory", permission: "inventory" },
  { href: "/reports", label: "Reports", permission: "reports" },
  { href: "/analytics", label: "Analytics", permission: "analytics" },
  { href: "/orders", label: "Orders", permission: "orders" },
  { href: "/floor", label: "Floor Plan", permission: "floor" },
  { href: "/customers", label: "Customers", permission: "customers" },
  { href: "/loyalty", label: "Loyalty", permission: "loyalty" },
  { href: "/suppliers", label: "Suppliers", permission: "suppliers" },
  { href: "/purchase-orders", label: "Purchase Orders", permission: "purchase_orders" },
  { href: "/cash-register", label: "Cash Register", permission: "cash_register" },
  { href: "/employees", label: "Employees", permission: "employees" },
  { href: "/roles", label: "Roles", permission: "roles" },
  { href: "/settings", label: "Settings", permission: "settings" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", permission: "admin_panel" },
  { href: "/admin/restaurants", label: "Restaurants", permission: "admin_panel" },
  { href: "/admin/subscriptions", label: "Subscriptions", permission: "admin_panel" },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  if (role === "super_admin") {
    return ADMIN_NAV;
  }
  return ALL_NAV.filter((item) => hasPermission(role, item.permission));
}
