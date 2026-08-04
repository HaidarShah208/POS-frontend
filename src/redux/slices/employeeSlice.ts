import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EmployeeState, Employee, ScheduleEntry, AttendanceStatus } from "@/types/employee";
import { loadFromStorage, saveToStorage } from "@/lib/localStorage";

const KEY = "pos-employees";
const FALLBACK: EmployeeState = { employees: [], clockRecords: [], schedules: [] };

function persist(state: EmployeeState) { saveToStorage(KEY, state); }

const employeeSlice = createSlice({
  name: "employees",
  initialState: loadFromStorage(KEY, FALLBACK),
  reducers: {
    addEmployee(state, action: PayloadAction<Omit<Employee, "id" | "createdAt" | "updatedAt">>) {
      const now = new Date().toISOString();
      state.employees.push({ ...action.payload, id: `emp-${Date.now()}`, createdAt: now, updatedAt: now });
      persist(state);
    },
    updateEmployee(state, action: PayloadAction<{ id: string } & Partial<Omit<Employee, "id" | "createdAt">>>) {
      const idx = state.employees.findIndex((e) => e.id === action.payload.id);
      if (idx >= 0) {
        state.employees[idx] = { ...state.employees[idx], ...action.payload, updatedAt: new Date().toISOString() };
        persist(state);
      }
    },
    deleteEmployee(state, action: PayloadAction<string>) {
      state.employees = state.employees.filter((e) => e.id !== action.payload);
      state.clockRecords = state.clockRecords.filter((c) => c.employeeId !== action.payload);
      state.schedules = state.schedules.filter((s) => s.employeeId !== action.payload);
      persist(state);
    },
    clockIn(state, action: PayloadAction<{ employeeId: string; status?: AttendanceStatus; notes?: string }>) {
      state.clockRecords.push({
        id: `clk-${Date.now()}`,
        employeeId: action.payload.employeeId,
        clockIn: new Date().toISOString(),
        status: action.payload.status ?? "present",
        notes: action.payload.notes,
      });
      persist(state);
    },
    clockOut(state, action: PayloadAction<string>) {
      const record = [...state.clockRecords].reverse().find((c) => c.employeeId === action.payload && !c.clockOut);
      if (record) {
        record.clockOut = new Date().toISOString();
        const diff = new Date(record.clockOut).getTime() - new Date(record.clockIn).getTime();
        record.hoursWorked = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
        persist(state);
      }
    },
    addSchedule(state, action: PayloadAction<Omit<ScheduleEntry, "id">>) {
      state.schedules.push({ ...action.payload, id: `sch-${Date.now()}` });
      persist(state);
    },
    deleteSchedule(state, action: PayloadAction<string>) {
      state.schedules = state.schedules.filter((s) => s.id !== action.payload);
      persist(state);
    },
  },
});

export const { addEmployee, updateEmployee, deleteEmployee, clockIn, clockOut, addSchedule, deleteSchedule } = employeeSlice.actions;
export const employeeReducer = employeeSlice.reducer;
