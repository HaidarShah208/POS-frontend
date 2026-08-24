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

export type InventoryItemType = "PRODUCT" | "INGREDIENT" | "PACKAGING";
export type InventoryItemUnit = "PCS" | "KG" | "G" | "L" | "ML" | "BOX" | "PACK";
export type InventoryItemStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface NewInventoryItem {
  id: string;
  organizationId: string;
  productId: string | null;
  name: string;
  type: InventoryItemType;
  unit: InventoryItemUnit;
  currentQuantity: number;
  minimumQuantity: number;
  costPerUnit: number;
  status: InventoryItemStatus;
  trackInventory: boolean;
  trackExpiry: boolean;
  product?: Product | null;
  createdAt: string;
  updatedAt: string;
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

export type StockMovementType =
  | "OPENING_STOCK"
  | "SALE"
  | "PURCHASE"
  | "RETURN"
  | "DAMAGE"
  | "WASTAGE"
  | "EXPIRED"
  | "MANUAL_ADJUSTMENT"
  | "STOCK_CORRECTION"
  | "RECIPE_DEDUCTION";

export type StockMovementReferenceType = "ORDER" | "PURCHASE_ORDER" | "MANUAL" | "SYSTEM" | "WASTE";

export interface StockMovement {
  id: string;
  organizationId: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  referenceType: StockMovementReferenceType | null;
  referenceId: string | null;
  performedById: string | null;
  notes: string | null;
  createdAt: string;
  inventoryItem?: NewInventoryItem;
  performedBy?: { id: string; name: string; email: string } | null;
}

export interface InventorySummary {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  expiringSoon: number;
}

export type WasteReason = "DAMAGED" | "EXPIRED" | "SPILLED" | "BURNED" | "SPOILED" | "OTHER";

export interface WasteRecord {
  id: string;
  organizationId: string;
  inventoryItemId: string;
  quantity: number;
  reason: WasteReason;
  notes: string | null;
  recordedById: string | null;
  createdAt: string;
  inventoryItem?: NewInventoryItem;
  recordedBy?: { id: string; name: string } | null;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  inventoryItemId: string;
  quantity: number;
  unit: string;
  inventoryItem?: NewInventoryItem;
}

export interface Recipe {
  id: string;
  organizationId: string;
  productId: string;
  name: string;
  isActive: boolean;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  ingredients?: RecipeIngredient[];
}

export type PurchaseOrderStatus = "DRAFT" | "SENT" | "PARTIAL" | "RECEIVED" | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  inventoryItem?: NewInventoryItem;
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  supplierId: string | null;
  orderNumber: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  notes: string | null;
  expectedDate: string | null;
  receivedDate: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier | null;
  items?: PurchaseOrderItem[];
}

export interface GetNewInventoryParams {
  page?: number;
  limit?: number;
  type?: InventoryItemType;
  status?: InventoryItemStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface GetStockMovementsParams {
  inventoryItemId?: string;
  type?: StockMovementType;
  referenceType?: StockMovementReferenceType;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdjustStockInput {
  inventoryItemId: string;
  type: "add" | "remove";
  quantity: number;
  reason: string;
  notes?: string;
}

export interface RecordWasteInput {
  inventoryItemId: string;
  quantity: number;
  reason: WasteReason;
  notes?: string;
}

export interface CreateRecipeInput {
  productId: string;
  name: string;
  ingredients: { inventoryItemId: string; quantity: number; unit: string }[];
}

export interface UpdateRecipeInput {
  name?: string;
  isActive?: boolean;
  ingredients?: { inventoryItemId: string; quantity: number; unit: string }[];
}

export interface CreateInventoryItemInput {
  name: string;
  type: InventoryItemType;
  unit: InventoryItemUnit;
  productId?: string;
  currentQuantity?: number;
  minimumQuantity?: number;
  costPerUnit?: number;
  trackInventory?: boolean;
  trackExpiry?: boolean;
}

export interface GetPurchaseOrdersParams {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
}

export interface CreatePurchaseOrderInput {
  supplierId?: string;
  notes?: string;
  expectedDate?: string;
  items: { inventoryItemId: string; orderedQuantity: number; unitCost: number }[];
}

export interface ReceiveItemsInput {
  items: { purchaseOrderItemId: string; receivedQuantity: number }[];
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
