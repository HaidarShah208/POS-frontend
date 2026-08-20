/**
 * API types — align with backend DTOs and responses.
 */

export type UserRole = "super_admin" | "owner" | "admin" | "cashier" | "kitchen" | (string & {});

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: string;
  organizationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductModifier {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  image?: string | null;
  description?: string | null;
  status?: string;
  modifiers?: ProductModifier[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  branchId: string;
  currentStock: number;
  lowStockThreshold: number;
  product?: Product;
  productName?: string;
  cost?: number;
  stockValue?: number;
  status?: "in_stock" | "low_stock" | "out_of_stock";
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  avgDailySales?: number;
  daysOfStock?: number;
  abcClass?: "A" | "B" | "C";
  barcode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StockMovementType = "purchase" | "sale" | "adjustment" | "transfer" | "waste" | "return" | "damaged";

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  reason?: string;
  reference?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  name: string;
  price: number;
  quantity: number;
  note?: string | null;
  modifiers?: ProductModifier[] | null;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderType = "dine-in" | "takeaway" | "delivery" | "drive-through";
export type PaymentMethod = "cash" | "card" | "mobile" | "other";

export interface Order {
  id: string;
  branchId: string;
  userId?: string | null;
  orderNumber: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  status: OrderStatus;
  tokenNumber: string;
  kitchenStatus?: string;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  branch?: Branch;
  user?: User | null;
}

export type CustomerStatus = "active" | "inactive" | "vip";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: CustomerStatus;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderAt?: string;
  loyaltyPoints?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: OrderStatus;
  orderType: OrderType;
  itemCount: number;
  createdAt: string;
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
}

export interface AuthResponse {
  user: User;
  token: string;
  permissions: string[];
  subscription?: {
    status: string;
    planSlug: string;
    trialEndsAt: string | null;
  };
}

export interface RoleDefinition {
  id: string;
  organizationId: string | null;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status: "active" | "suspended" | "trial" | "inactive";
  createdAt: string;
  updatedAt: string;
  userCount?: number;
  subscription?: {
    id: string;
    status: string;
    plan?: { name: string; slug: string };
    trialEndsAt?: string | null;
  };
}

export interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface RegisterOrgInput {
  restaurantName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Place order request (matches cart + totals) */
export interface PlaceOrderRequest {
  branchId?: string;
  items: { id: string; productId: string; name: string; price: number; quantity: number; note?: string; modifiers?: ProductModifier[] }[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  grandTotal?: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

/** Place order response */
export interface PlaceOrderResponse {
  orderId: string;
  tokenNumber: string;
}

/** Kitchen order status */
export type KitchenOrderStatus = "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

/** Inventory adjust request */
export interface AdjustStockRequest {
  productId: string;
  branchId: string;
  type: "add" | "remove";
  quantity: number;
  reason: string;
}

/** Products list query params */
export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}

/** Orders list query params */
export interface GetOrdersParams {
  page?: number;
  limit?: number;
  branchId?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
}

/** Inventory list query params */
export interface GetInventoryParams {
  page?: number;
  limit?: number;
  lowStockOnly?: boolean;
}

/** Supplier types */
export type SupplierStatus = "active" | "inactive";

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: SupplierStatus;
  totalOrders?: number;
  totalSpent?: number;
  outstandingBalance?: number;
  lastOrderAt?: string;
  productsSupplied?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierPurchase {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  amount: number;
  status: "pending" | "paid" | "partial";
  items: number;
  date: string;
}

export interface GetSuppliersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SupplierStatus;
}
