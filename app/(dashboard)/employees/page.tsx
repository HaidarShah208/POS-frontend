"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose,
} from "@/components/ui/drawer";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { addEmployee, updateEmployee, deleteEmployee, clockIn, clockOut, addSchedule, deleteSchedule } from "@/redux/slices/employeeSlice";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Employee, EmployeeRole, EmployeeStatus, ScheduleEntry } from "@/types/employee";
import {
  UserCog, Plus, Search, X, ChevronRight, Clock, LogIn, LogOut,
  Users, UserCheck, UserX, DollarSign, Calendar, Save, Trash2,
  Phone, Mail, MapPin, Briefcase, CalendarPlus,
} from "lucide-react";

type ViewTab = "staff" | "attendance" | "schedule" | "payroll";

const ROLE_LABELS: Record<EmployeeRole, { label: string; color: string }> = {
  manager: { label: "Manager", color: "bg-purple-100 text-purple-700" },
  cashier: { label: "Cashier", color: "bg-blue-100 text-blue-700" },
  chef: { label: "Chef", color: "bg-amber-100 text-amber-700" },
  waiter: { label: "Waiter", color: "bg-emerald-100 text-emerald-700" },
  delivery: { label: "Delivery", color: "bg-sky-100 text-sky-700" },
  cleaner: { label: "Cleaner", color: "bg-slate-100 text-slate-600" },
};

const STATUS_LABELS: Record<EmployeeStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Inactive", color: "bg-slate-100 text-slate-600" },
  on_leave: { label: "On Leave", color: "bg-amber-100 text-amber-700" },
};

const ROLES: EmployeeRole[] = ["manager", "cashier", "chef", "waiter", "delivery", "cleaner"];

function EmployeeFormDrawer({ open, onClose, employee }: { open: boolean; onClose: () => void; employee?: Employee }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(employee?.name ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [role, setRole] = useState<EmployeeRole>(employee?.role ?? "waiter");
  const [status, setStatus] = useState<EmployeeStatus>(employee?.status ?? "active");
  const [salary, setSalary] = useState(String(employee?.salary ?? ""));
  const [hireDate, setHireDate] = useState(employee?.hireDate ?? new Date().toISOString().slice(0, 10));
  const [address, setAddress] = useState(employee?.address ?? "");
  const [notes, setNotes] = useState(employee?.notes ?? "");
  const isEdit = !!employee;

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!salary || Number(salary) < 0) { toast.error("Enter a valid salary"); return; }
    const payload = { name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, role, status, salary: Number(salary), hireDate, address: address.trim() || undefined, notes: notes.trim() || undefined };
    if (isEdit) {
      dispatch(updateEmployee({ id: employee.id, ...payload }));
      toast.success("Employee updated");
    } else {
      dispatch(addEmployee(payload));
      toast.success("Employee added");
    }
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-xl ml-auto h-full rounded-none border-l border-[var(--border)]">
        <DrawerHeader className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">{isEdit ? "Edit Employee" : "Add Employee"}</DrawerTitle>
            <DrawerClose asChild><Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button></DrawerClose>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as EmployeeRole)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20">
                {(["active", "inactive", "on_leave"] as EmployeeStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Salary</label>
              <Input type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Monthly salary" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Hire Date</label>
              <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes" />
          </div>
        </div>
        <div className="shrink-0 border-t border-[var(--border)] px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-1.5"><Save className="h-4 w-4" />{isEdit ? "Update" : "Add"}</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ScheduleDrawer({ open, onClose, employees }: { open: boolean; onClose: () => void; employees: Employee[] }) {
  const dispatch = useAppDispatch();
  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [schNotes, setSchNotes] = useState("");

  const handleAdd = () => {
    if (!empId) { toast.error("Select an employee"); return; }
    dispatch(addSchedule({ employeeId: empId, date, startTime, endTime, notes: schNotes.trim() || undefined }));
    toast.success("Schedule added");
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-md ml-auto h-full rounded-none border-l border-[var(--border)]">
        <DrawerHeader className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">Add Schedule</DrawerTitle>
            <DrawerClose asChild><Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button></DrawerClose>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Employee *</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20">
              <option value="">Select employee</option>
              {employees.filter((e) => e.status === "active").map((e) => <option key={e.id} value={e.id}>{e.name} ({ROLE_LABELS[e.role].label})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Notes</label>
            <Input value={schNotes} onChange={(e) => setSchNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
        <div className="shrink-0 border-t border-[var(--border)] px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} className="gap-1.5"><CalendarPlus className="h-4 w-4" />Add Schedule</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function EmployeesPage() {
  const dispatch = useAppDispatch();
  const { employees, clockRecords, schedules } = useAppSelector((s) => s.employees);
  const [viewTab, setViewTab] = useState<ViewTab>("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | undefined>();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const activeEmps = employees.filter((e) => e.status === "active").length;
  const onLeave = employees.filter((e) => e.status === "on_leave").length;
  const totalPayroll = employees.filter((e) => e.status === "active").reduce((s, e) => s + e.salary, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const clockedInToday = useMemo(() => {
    const todayRecords = clockRecords.filter((c) => c.clockIn.startsWith(todayStr));
    return new Set(todayRecords.filter((c) => !c.clockOut).map((c) => c.employeeId));
  }, [clockRecords, todayStr]);

  const filteredEmps = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((e) => e.name.toLowerCase().includes(q) || e.role.includes(q));
  }, [employees, searchQuery]);

  const todaySchedules = useMemo(() => schedules.filter((s) => s.date === todayStr), [schedules, todayStr]);

  const totalHoursMonth = useMemo(() => {
    const monthPrefix = todayStr.slice(0, 7);
    return clockRecords
      .filter((c) => c.clockIn.startsWith(monthPrefix) && c.hoursWorked)
      .reduce((s, c) => s + (c.hoursWorked ?? 0), 0);
  }, [clockRecords, todayStr]);

  const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "staff", label: "Staff", icon: <Users className="h-4 w-4" /> },
    { id: "attendance", label: "Attendance", icon: <Clock className="h-4 w-4" /> },
    { id: "schedule", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
    { id: "payroll", label: "Payroll", icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <RoleGuard permission="employees">
      <PageMotion>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Manage staff, attendance, schedules, and payroll</p>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            {viewTab === "schedule" && (
              <Button variant="outline" onClick={() => setScheduleOpen(true)} className="gap-2"><CalendarPlus className="h-4 w-4" />Add Schedule</Button>
            )}
            <Button onClick={() => { setEditEmp(undefined); setFormOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Employee</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard title="Total Staff" value={employees.length} animate icon={<Users className="h-5 w-5" />} />
          <StatsCard title="Active" value={activeEmps} animate icon={<UserCheck className="h-5 w-5" />} />
          <StatsCard title="On Leave" value={onLeave} animate icon={<UserX className="h-5 w-5" />} />
          <StatsCard title="Clocked In" value={clockedInToday.size} animate icon={<Clock className="h-5 w-5" />} subtitle="Today" />
          <StatsCard title="Monthly Payroll" value={formatCurrency(totalPayroll)} icon={<DollarSign className="h-5 w-5" />} />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {VIEW_TABS.map((t) => (
            <Button key={t.id} variant={viewTab === t.id ? "default" : "outline"} size="sm" className="gap-1.5 shrink-0" onClick={() => setViewTab(t.id)}>
              {t.icon}{t.label}
            </Button>
          ))}
        </div>

        {viewTab === "staff" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                  <input type="text" placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
                </div>
              </div>
              <div className="p-4">
                {employees.length === 0 ? (
                  <EmptyState title="No employees" description="Add your first team member to start managing staff."
                    icon={<UserCog className="h-6 w-6" />}
                    action={<Button size="sm" onClick={() => { setEditEmp(undefined); setFormOpen(true); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Employee</Button>} />
                ) : filteredEmps.length === 0 ? (
                  <EmptyState title="No matching employees" description="Try a different search." icon={<Search className="h-6 w-6" />} />
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {filteredEmps.map((emp) => {
                        const rl = ROLE_LABELS[emp.role];
                        const sl = STATUS_LABELS[emp.status];
                        const isClockedIn = clockedInToday.has(emp.id);
                        return (
                          <motion.div key={emp.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group">
                            <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 transition-all hover:shadow-md hover:border-[var(--primary)]/20">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-bold">
                                {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">{emp.name}</span>
                                  <Badge className={cn("text-[10px]", rl.color)}>{rl.label}</Badge>
                                  <Badge className={cn("text-[10px]", sl.color)}>{sl.label}</Badge>
                                  {isClockedIn && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--muted-foreground)]">
                                  {emp.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{emp.phone}</span>}
                                  {emp.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{emp.email}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {emp.status === "active" && (
                                  isClockedIn ? (
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => { dispatch(clockOut(emp.id)); toast.success(`${emp.name} clocked out`); }}>
                                      <LogOut className="h-3 w-3" />Out
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                      onClick={() => { dispatch(clockIn({ employeeId: emp.id })); toast.success(`${emp.name} clocked in`); }}>
                                      <LogIn className="h-3 w-3" />In
                                    </Button>
                                  )
                                )}
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditEmp(emp); setFormOpen(true); }}>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {viewTab === "attendance" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="text-sm font-semibold">Today&apos;s Attendance</h3>
                <p className="text-xs text-[var(--muted-foreground)]">{todayStr}</p>
              </div>
              <div className="p-4">
                {employees.filter((e) => e.status === "active").length === 0 ? (
                  <EmptyState title="No active employees" description="Add employees to track attendance." icon={<Clock className="h-6 w-6" />} />
                ) : (
                  <div className="space-y-2">
                    {employees.filter((e) => e.status === "active").map((emp) => {
                      const todayRecs = clockRecords.filter((c) => c.employeeId === emp.id && c.clockIn.startsWith(todayStr));
                      const hoursToday = todayRecs.reduce((s, c) => s + (c.hoursWorked ?? 0), 0);
                      const isClockedIn = clockedInToday.has(emp.id);
                      return (
                        <div key={emp.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold">
                            {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{emp.name}</span>
                              {isClockedIn ? (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 gap-0.5"><span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />Clocked In</Badge>
                              ) : todayRecs.length > 0 ? (
                                <Badge className="text-[10px] bg-slate-100 text-slate-600">Done</Badge>
                              ) : (
                                <Badge className="text-[10px] bg-red-100 text-red-600">Absent</Badge>
                              )}
                            </div>
                            {todayRecs.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-0.5">
                                <span>{todayRecs.length} record{todayRecs.length !== 1 ? "s" : ""}</span>
                                <span>·</span>
                                <span>{hoursToday.toFixed(1)}h logged</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {isClockedIn ? (
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => { dispatch(clockOut(emp.id)); toast.success("Clocked out"); }}>
                                <LogOut className="h-3 w-3" />Clock Out
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => { dispatch(clockIn({ employeeId: emp.id })); toast.success("Clocked in"); }}>
                                <LogIn className="h-3 w-3" />Clock In
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {totalHoursMonth > 0 && (
                  <div className="mt-4 rounded-lg bg-[var(--muted)]/30 px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Total hours this month</span>
                    <span className="font-bold tabular-nums">{totalHoursMonth.toFixed(1)}h</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {viewTab === "schedule" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Today&apos;s Schedule</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{todayStr}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)} className="gap-1.5 text-xs"><CalendarPlus className="h-3 w-3" />Add</Button>
              </div>
              <div className="p-4">
                {todaySchedules.length === 0 ? (
                  <EmptyState title="No schedules today" description="Add shift schedules for your team." icon={<Calendar className="h-6 w-6" />}
                    action={<Button size="sm" onClick={() => setScheduleOpen(true)} className="gap-1.5"><CalendarPlus className="h-3.5 w-3.5" />Add Schedule</Button>} />
                ) : (
                  <div className="space-y-2">
                    {todaySchedules.map((sch) => {
                      const emp = employees.find((e) => e.id === sch.employeeId);
                      return (
                        <div key={sch.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold">
                            {emp ? emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{emp?.name ?? "Unknown"}</span>
                            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{sch.startTime} – {sch.endTime}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => { dispatch(deleteSchedule(sch.id)); toast.success("Schedule removed"); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {viewTab === "payroll" && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="text-sm font-semibold">Payroll Overview</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Monthly salary breakdown for active employees</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                    <p className="text-xs text-[var(--muted-foreground)]">Total Payroll</p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(totalPayroll)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                    <p className="text-xs text-[var(--muted-foreground)]">Avg Salary</p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(activeEmps > 0 ? totalPayroll / activeEmps : 0)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 px-4 py-3 text-center">
                    <p className="text-xs text-[var(--muted-foreground)]">Hours (Month)</p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">{totalHoursMonth.toFixed(0)}h</p>
                  </div>
                </div>
                {employees.filter((e) => e.status === "active").length === 0 ? (
                  <EmptyState title="No active employees" description="Add employees to view payroll." icon={<DollarSign className="h-6 w-6" />} />
                ) : (
                  <div className="space-y-1.5">
                    {employees.filter((e) => e.status === "active").sort((a, b) => b.salary - a.salary).map((emp) => {
                      const rl = ROLE_LABELS[emp.role];
                      const pct = totalPayroll > 0 ? (emp.salary / totalPayroll) * 100 : 0;
                      const monthRecords = clockRecords.filter((c) => c.employeeId === emp.id && c.clockIn.startsWith(todayStr.slice(0, 7)));
                      const hrs = monthRecords.reduce((s, c) => s + (c.hoursWorked ?? 0), 0);
                      return (
                        <div key={emp.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold">
                            {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">{emp.name}</span>
                              <Badge className={cn("text-[10px]", rl.color)}>{rl.label}</Badge>
                            </div>
                            <span className="text-[10px] text-[var(--muted-foreground)]">{hrs.toFixed(1)}h logged</span>
                          </div>
                          <div className="w-20 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden shrink-0">
                            <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-bold tabular-nums w-24 text-right shrink-0">{formatCurrency(emp.salary)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <EmployeeFormDrawer open={formOpen} onClose={() => { setFormOpen(false); setEditEmp(undefined); }} employee={editEmp} />
        <ScheduleDrawer open={scheduleOpen} onClose={() => setScheduleOpen(false)} employees={employees} />
      </PageMotion>
    </RoleGuard>
  );
}
