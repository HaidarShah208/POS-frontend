export type ShiftStatus = "open" | "closed";
export type CashEntryType = "cash_in" | "cash_out" | "expense" | "sale" | "refund";

export interface CashEntry {
  id: string;
  type: CashEntryType;
  amount: number;
  description: string;
  category?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  status: ShiftStatus;
  openingBalance: number;
  expectedBalance: number;
  actualBalance?: number;
  difference?: number;
  entries: CashEntry[];
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

export interface CashRegisterState {
  currentShift: Shift | null;
  shiftHistory: Shift[];
}
