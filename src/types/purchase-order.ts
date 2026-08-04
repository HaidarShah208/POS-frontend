export type POStatus = "draft" | "pending" | "approved" | "received" | "partial" | "cancelled";

export interface POLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  receivedQty: number;
  unitCost: number;
  tax: number;
  discount: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  items: POLineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  notes?: string;
  expectedDate?: string;
  receivedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POState {
  orders: PurchaseOrder[];
  nextPoNumber: number;
}
