import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  FloorState,
  FloorTable,
  Floor,
  TableStatus,
  TablePosition,
} from "@/types/floor";
import { loadFromStorage, saveToStorage } from "@/lib/localStorage";

const KEY = "pos-floor";

function persist(state: FloorState) {
  const { selectedTableId, editMode, ...rest } = state;
  saveToStorage(KEY, { ...rest, selectedTableId: null, editMode: false });
}

const defaultFloors: Floor[] = [
  { id: "floor-1", name: "Main Hall", sortOrder: 0 },
  { id: "floor-2", name: "Outdoor", sortOrder: 1 },
  { id: "floor-3", name: "VIP Room", sortOrder: 2 },
];

const defaultTables: FloorTable[] = [
  { id: "t-1", number: 1, label: "T1", shape: "square", capacity: 4, status: "available", position: { x: 60, y: 60 }, width: 80, height: 80, rotation: 0, floorId: "floor-1" },
  { id: "t-2", number: 2, label: "T2", shape: "square", capacity: 4, status: "available", position: { x: 200, y: 60 }, width: 80, height: 80, rotation: 0, floorId: "floor-1" },
  { id: "t-3", number: 3, label: "T3", shape: "round", capacity: 6, status: "available", position: { x: 340, y: 60 }, width: 90, height: 90, rotation: 0, floorId: "floor-1" },
  { id: "t-4", number: 4, label: "T4", shape: "rectangle", capacity: 8, status: "available", position: { x: 60, y: 200 }, width: 140, height: 80, rotation: 0, floorId: "floor-1" },
  { id: "t-5", number: 5, label: "T5", shape: "round", capacity: 2, status: "available", position: { x: 260, y: 200 }, width: 70, height: 70, rotation: 0, floorId: "floor-1" },
  { id: "t-6", number: 6, label: "T6", shape: "square", capacity: 4, status: "available", position: { x: 400, y: 200 }, width: 80, height: 80, rotation: 0, floorId: "floor-1" },
  { id: "t-7", number: 7, label: "T7", shape: "rectangle", capacity: 10, status: "available", position: { x: 60, y: 340 }, width: 160, height: 80, rotation: 0, floorId: "floor-1" },
  { id: "t-8", number: 8, label: "T8", shape: "round", capacity: 4, status: "available", position: { x: 300, y: 340 }, width: 80, height: 80, rotation: 0, floorId: "floor-1" },
  { id: "t-9", number: 9, label: "T9", shape: "square", capacity: 4, status: "available", position: { x: 80, y: 80 }, width: 80, height: 80, rotation: 0, floorId: "floor-2" },
  { id: "t-10", number: 10, label: "T10", shape: "round", capacity: 6, status: "available", position: { x: 240, y: 80 }, width: 90, height: 90, rotation: 0, floorId: "floor-2" },
  { id: "t-11", number: 11, label: "VIP 1", shape: "oval", capacity: 8, status: "available", position: { x: 80, y: 80 }, width: 140, height: 100, rotation: 0, floorId: "floor-3" },
  { id: "t-12", number: 12, label: "VIP 2", shape: "rectangle", capacity: 12, status: "available", position: { x: 300, y: 80 }, width: 180, height: 90, rotation: 0, floorId: "floor-3" },
];

const DEFAULT_STATE: FloorState = {
  floors: defaultFloors,
  tables: defaultTables,
  reservations: [],
  activeFloorId: "floor-1",
  selectedTableId: null,
  editMode: false,
};

const floorSlice = createSlice({
  name: "floor",
  initialState: loadFromStorage(KEY, DEFAULT_STATE),
  reducers: {
    setActiveFloor(state, action: PayloadAction<string>) {
      state.activeFloorId = action.payload;
      state.selectedTableId = null;
    },
    selectTable(state, action: PayloadAction<string | null>) {
      state.selectedTableId = action.payload;
    },
    toggleEditMode(state) {
      state.editMode = !state.editMode;
      state.selectedTableId = null;
    },
    updateTablePosition(state, action: PayloadAction<{ id: string; position: TablePosition }>) {
      const table = state.tables.find((t) => t.id === action.payload.id);
      if (table) table.position = action.payload.position;
      persist(state);
    },
    updateTableStatus(state, action: PayloadAction<{ id: string; status: TableStatus; guestCount?: number; assignedWaiter?: string }>) {
      const table = state.tables.find((t) => t.id === action.payload.id);
      if (!table) return;
      table.status = action.payload.status;
      if (action.payload.guestCount !== undefined) table.guestCount = action.payload.guestCount;
      if (action.payload.assignedWaiter !== undefined) table.assignedWaiter = action.payload.assignedWaiter;
      if (action.payload.status === "occupied") table.occupiedSince = new Date().toISOString();
      if (action.payload.status === "available") {
        table.occupiedSince = undefined;
        table.guestCount = undefined;
        table.currentOrderId = undefined;
        table.assignedWaiter = undefined;
        table.reservedBy = undefined;
        table.reservedAt = undefined;
        table.notes = undefined;
      }
      persist(state);
    },
    assignWaiter(state, action: PayloadAction<{ tableId: string; waiter: string }>) {
      const table = state.tables.find((t) => t.id === action.payload.tableId);
      if (table) table.assignedWaiter = action.payload.waiter;
      persist(state);
    },
    setTableNotes(state, action: PayloadAction<{ tableId: string; notes: string }>) {
      const table = state.tables.find((t) => t.id === action.payload.tableId);
      if (table) table.notes = action.payload.notes;
      persist(state);
    },
    reserveTable(state, action: PayloadAction<{ tableId: string; customerName: string; customerPhone?: string; guestCount: number; date: string; time: string; notes?: string }>) {
      const { tableId, ...rest } = action.payload;
      const table = state.tables.find((t) => t.id === tableId);
      if (table) {
        table.status = "reserved";
        table.reservedBy = rest.customerName;
        table.reservedAt = `${rest.date}T${rest.time}`;
      }
      state.reservations.push({
        id: `res-${Date.now()}`,
        tableId,
        ...rest,
        status: "upcoming",
      });
      persist(state);
    },
    cancelReservation(state, action: PayloadAction<string>) {
      const res = state.reservations.find((r) => r.id === action.payload);
      if (res) {
        res.status = "cancelled";
        const table = state.tables.find((t) => t.id === res.tableId);
        if (table && table.status === "reserved") {
          table.status = "available";
          table.reservedBy = undefined;
          table.reservedAt = undefined;
        }
      }
      persist(state);
    },
    mergeTables(state, action: PayloadAction<{ primaryId: string; mergeIds: string[] }>) {
      const primary = state.tables.find((t) => t.id === action.payload.primaryId);
      if (!primary) return;
      primary.mergedWith = action.payload.mergeIds;
      primary.status = "occupied";
      primary.capacity = state.tables
        .filter((t) => t.id === action.payload.primaryId || action.payload.mergeIds.includes(t.id))
        .reduce((s, t) => s + t.capacity, 0);
      for (const id of action.payload.mergeIds) {
        const t = state.tables.find((tb) => tb.id === id);
        if (t) t.status = "merged";
      }
      persist(state);
    },
    splitTable(state, action: PayloadAction<string>) {
      const table = state.tables.find((t) => t.id === action.payload);
      if (!table || !table.mergedWith) return;
      for (const id of table.mergedWith) {
        const t = state.tables.find((tb) => tb.id === id);
        if (t) t.status = "available";
      }
      table.mergedWith = undefined;
      table.status = "available";
      persist(state);
    },
    transferTable(state, action: PayloadAction<{ fromId: string; toId: string }>) {
      const from = state.tables.find((t) => t.id === action.payload.fromId);
      const to = state.tables.find((t) => t.id === action.payload.toId);
      if (!from || !to) return;
      to.status = from.status;
      to.guestCount = from.guestCount;
      to.currentOrderId = from.currentOrderId;
      to.assignedWaiter = from.assignedWaiter;
      to.occupiedSince = from.occupiedSince;
      to.notes = from.notes;
      from.status = "cleaning";
      from.guestCount = undefined;
      from.currentOrderId = undefined;
      from.assignedWaiter = undefined;
      from.occupiedSince = undefined;
      from.notes = undefined;
      persist(state);
    },
    addTable(state, action: PayloadAction<Omit<FloorTable, "id">>) {
      state.tables.push({ ...action.payload, id: `t-${Date.now()}` });
      persist(state);
    },
    removeTable(state, action: PayloadAction<string>) {
      state.tables = state.tables.filter((t) => t.id !== action.payload);
      persist(state);
    },
    addFloor(state, action: PayloadAction<{ name: string }>) {
      const id = `floor-${Date.now()}`;
      state.floors.push({ id, name: action.payload.name, sortOrder: state.floors.length });
      persist(state);
    },
  },
});

export const {
  setActiveFloor,
  selectTable,
  toggleEditMode,
  updateTablePosition,
  updateTableStatus,
  assignWaiter,
  setTableNotes,
  reserveTable,
  cancelReservation,
  mergeTables,
  splitTable,
  transferTable,
  addTable,
  removeTable,
  addFloor,
} = floorSlice.actions;
export const floorReducer = floorSlice.reducer;
