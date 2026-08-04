import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CashRegisterState, Shift, CashEntry, CashEntryType } from "@/types/cash-register";
import { loadFromStorage, saveToStorage } from "@/lib/localStorage";

const KEY = "pos-cash-register";
const FALLBACK: CashRegisterState = { currentShift: null, shiftHistory: [] };

function persist(state: CashRegisterState) { saveToStorage(KEY, state); }

function calcExpected(shift: Shift): number {
  return shift.entries.reduce((bal, e) => {
    if (e.type === "cash_in" || e.type === "sale") return bal + e.amount;
    return bal - e.amount;
  }, shift.openingBalance);
}

const cashRegisterSlice = createSlice({
  name: "cashRegister",
  initialState: loadFromStorage(KEY, FALLBACK),
  reducers: {
    openShift(state, action: PayloadAction<{ userId: string; userName: string; openingBalance: number }>) {
      const { userId, userName, openingBalance } = action.payload;
      state.currentShift = {
        id: `shift-${Date.now()}`,
        userId,
        userName,
        status: "open",
        openingBalance,
        expectedBalance: openingBalance,
        entries: [],
        openedAt: new Date().toISOString(),
      };
      persist(state);
    },
    addCashEntry(state, action: PayloadAction<{ type: CashEntryType; amount: number; description: string; category?: string }>) {
      if (!state.currentShift) return;
      const entry: CashEntry = {
        id: `ce-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: action.payload.type,
        amount: action.payload.amount,
        description: action.payload.description,
        category: action.payload.category,
        createdAt: new Date().toISOString(),
      };
      state.currentShift.entries.push(entry);
      state.currentShift.expectedBalance = calcExpected(state.currentShift);
      persist(state);
    },
    closeShift(state, action: PayloadAction<{ actualBalance: number; notes?: string }>) {
      if (!state.currentShift) return;
      state.currentShift.status = "closed";
      state.currentShift.closedAt = new Date().toISOString();
      state.currentShift.actualBalance = action.payload.actualBalance;
      state.currentShift.difference = action.payload.actualBalance - state.currentShift.expectedBalance;
      state.currentShift.notes = action.payload.notes;
      state.shiftHistory.unshift({ ...state.currentShift });
      state.currentShift = null;
      persist(state);
    },
    deleteShiftHistory(state, action: PayloadAction<string>) {
      state.shiftHistory = state.shiftHistory.filter((s) => s.id !== action.payload);
      persist(state);
    },
  },
});

export const { openShift, addCashEntry, closeShift, deleteShiftHistory } = cashRegisterSlice.actions;
export const cashRegisterReducer = cashRegisterSlice.reducer;
