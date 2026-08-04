export type EmployeeStatus = "active" | "inactive" | "on_leave";
export type EmployeeRole = "manager" | "cashier" | "chef" | "waiter" | "delivery" | "cleaner";
export type AttendanceStatus = "present" | "absent" | "late" | "half_day";

export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  salary: number;
  hireDate: string;
  address?: string;
  avatar?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClockRecord {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut?: string;
  hoursWorked?: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  role?: string;
  notes?: string;
}

export interface EmployeeState {
  employees: Employee[];
  clockRecords: ClockRecord[];
  schedules: ScheduleEntry[];
}
