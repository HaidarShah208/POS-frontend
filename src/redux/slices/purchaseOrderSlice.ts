import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { POState, PurchaseOrder, POStatus, POLineItem } from "@/types/purchase-order";
import { loadFromStorage, saveToStorage } from "@/lib/localStorage";

const KEY = "pos-purchase-orders";
const FALLBACK: POState = { orders: [], nextPoNumber: 1001 };

function persist(state: POState) { saveToStorage(KEY, state); }

function recalcTotals(po: PurchaseOrder) {
  po.subtotal = po.items.reduce((s, i) => s + i.unitCost * i.quantity, 0);
  po.taxTotal = po.items.reduce((s, i) => s + i.tax, 0);
  po.discountTotal = po.items.reduce((s, i) => s + i.discount, 0);
  po.grandTotal = po.subtotal + po.taxTotal - po.discountTotal;
  po.items.forEach((i) => { i.total = i.unitCost * i.quantity + i.tax - i.discount; });
}

const purchaseOrderSlice = createSlice({
  name: "purchaseOrders",
  initialState: loadFromStorage(KEY, FALLBACK),
  reducers: {
    createPO(state, action: PayloadAction<{ supplierId: string; supplierName: string; items: Omit<POLineItem, "id" | "receivedQty" | "total">[]; notes?: string; expectedDate?: string }>) {
      const { supplierId, supplierName, items, notes, expectedDate } = action.payload;
      const now = new Date().toISOString();
      const po: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber: `PO-${state.nextPoNumber}`,
        supplierId,
        supplierName,
        status: "pending",
        items: items.map((i, idx) => ({
          ...i,
          id: `poi-${Date.now()}-${idx}`,
          receivedQty: 0,
          total: i.unitCost * i.quantity + i.tax - i.discount,
        })),
        subtotal: 0,
        taxTotal: 0,
        discountTotal: 0,
        grandTotal: 0,
        notes,
        expectedDate,
        createdAt: now,
        updatedAt: now,
      };
      recalcTotals(po);
      state.orders.unshift(po);
      state.nextPoNumber += 1;
      persist(state);
    },
    updatePOStatus(state, action: PayloadAction<{ id: string; status: POStatus }>) {
      const po = state.orders.find((o) => o.id === action.payload.id);
      if (po) {
        po.status = action.payload.status;
        po.updatedAt = new Date().toISOString();
        if (action.payload.status === "received") po.receivedDate = new Date().toISOString();
        persist(state);
      }
    },
    receiveItems(state, action: PayloadAction<{ poId: string; receivedItems: { lineItemId: string; qty: number }[] }>) {
      const po = state.orders.find((o) => o.id === action.payload.poId);
      if (!po) return;
      for (const ri of action.payload.receivedItems) {
        const item = po.items.find((i) => i.id === ri.lineItemId);
        if (item) item.receivedQty = Math.min(item.receivedQty + ri.qty, item.quantity);
      }
      const allReceived = po.items.every((i) => i.receivedQty >= i.quantity);
      const someReceived = po.items.some((i) => i.receivedQty > 0);
      po.status = allReceived ? "received" : someReceived ? "partial" : po.status;
      if (allReceived) po.receivedDate = new Date().toISOString();
      po.updatedAt = new Date().toISOString();
      persist(state);
    },
    deletePO(state, action: PayloadAction<string>) {
      state.orders = state.orders.filter((o) => o.id !== action.payload);
      persist(state);
    },
  },
});

export const { createPO, updatePOStatus, receiveItems, deletePO } = purchaseOrderSlice.actions;
export const purchaseOrderReducer = purchaseOrderSlice.reducer;
