export type TableShape = "square" | "round" | "rectangle" | "oval";
export type TableStatus = "available" | "occupied" | "reserved" | "merged" | "cleaning";

export interface TablePosition {
  x: number;
  y: number;
}

export interface FloorTable {
  id: string;
  number: number;
  label: string;
  shape: TableShape;
  capacity: number;
  status: TableStatus;
  position: TablePosition;
  width: number;
  height: number;
  rotation: number;
  floorId: string;
  assignedWaiter?: string;
  currentOrderId?: string;
  reservedBy?: string;
  reservedAt?: string;
  mergedWith?: string[];
  guestCount?: number;
  occupiedSince?: string;
  notes?: string;
}

export interface Floor {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Reservation {
  id: string;
  tableId: string;
  customerName: string;
  customerPhone?: string;
  guestCount: number;
  date: string;
  time: string;
  notes?: string;
  status: "upcoming" | "seated" | "completed" | "cancelled";
}

export interface FloorState {
  floors: Floor[];
  tables: FloorTable[];
  reservations: Reservation[];
  activeFloorId: string;
  selectedTableId: string | null;
  editMode: boolean;
}
