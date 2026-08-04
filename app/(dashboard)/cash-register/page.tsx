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
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose,
} from "@/components/ui/modal";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { openShift, addCashEntry, closeShift, deleteShiftHistory } from "@/redux/slices/cashRegisterSlice";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CashEntryType, Shift } from "@/types/cash-register";
import {
  Banknote, Plus, ArrowDownToLine, ArrowUpFromLine, Receipt,
  Clock, DollarSign, Minus, CheckCircle2, XCircle,
  ChevronRight, CalendarDays, Trash2, Lock, Unlock,
  TrendingUp, TrendingDown, RotateCcw, ShoppingBag,
} from "lucide-react";

const ENTRY_CONFIG: Record<CashEntryType, { label: string; icon: React.ReactNode; color: string; direction: "in" | "out" }> = {
  cash_in: { label: "Cash In", icon: <ArrowDownToLine className="h-3.5 w-3.5" />, color: "text-emerald-600 bg-emerald-100", direction: "in" },
  cash_out: { label: "Cash Out", icon: <ArrowUpFromLine className="h-3.5 w-3.5" />, color: "text-red-600 bg-red-100", direction: "out" },
  expense: { label: "Expense", icon: <Receipt className="h-3.5 w-3.5" />, color: "text-amber-600 bg-amber-100", direction: "out" },
  sale: { label: "Sale", icon: <ShoppingBag className="h-3.5 w-3.5" />, color: "text-blue-600 bg-blue-100", direction: "in" },
  refund: { label: "Refund", icon: <RotateCcw className="h-3.5 w-3.5" />, color: "text-purple-600 bg-purple-100", direction: "out" },
};

const EXPENSE_CATEGORIES = ["Supplies", "Cleaning", "Repairs", "Delivery", "Utilities", "Miscellaneous"];

function ShiftSummaryCard({ shift, onDelete }: { shift: Shift; onDelete?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const duration = shift.closedAt
    ? Math.round((new Date(shift.closedAt).getTime() - new Date(shift.openedAt).getTime()) / (1000 * 60 * 60) * 10) / 10
    : null;
  const totalIn = shift.entries.filter((e) => e.type === "cash_in" || e.type === "sale").reduce((s, e) => s + e.amount, 0);
  const totalOut = shift.entries.filter((e) => e.type === "cash_out" || e.type === "expense" || e.type === "refund").reduce((s, e) => s + e.amount, 0);

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <button type="button" onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[var(--muted)]/30">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", shift.status === "open" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600")}>
            {shift.status === "open" ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{shift.userName}</span>
              <Badge className={cn("text-[10px]", shift.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                {shift.status === "open" ? "Active" : "Closed"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted-foreground)]">
              <CalendarDays className="h-3 w-3" />
              {new Date(shift.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              {duration !== null && <span>· {duration}h</span>}
              <span>· {shift.entries.length} entries</span>
            </div>
          </div>
          <span className="text-sm font-bold tabular-nums shrink-0">{formatCurrency(shift.expectedBalance)}</span>
          <ChevronRight className={cn("h-4 w-4 text-[var(--muted-foreground)] shrink-0 transition-transform", expanded && "rotate-90")} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="border-t border-[var(--border)] px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-[var(--muted)]/30 px-3 py-2">
                    <p className="text-[var(--muted-foreground)]">Opening</p>
                    <p className="font-bold tabular-nums">{formatCurrency(shift.openingBalance)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-3 py-2">
                    <p className="text-emerald-600">Cash In</p>
                    <p className="font-bold tabular-nums text-emerald-700">{formatCurrency(totalIn)}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 px-3 py-2">
                    <p className="text-red-600">Cash Out</p>
                    <p className="font-bold tabular-nums text-red-700">{formatCurrency(totalOut)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--muted)]/30 px-3 py-2">
                    <p className="text-[var(--muted-foreground)]">Expected</p>
                    <p className="font-bold tabular-nums">{formatCurrency(shift.expectedBalance)}</p>
                  </div>
                </div>
                {shift.status === "closed" && shift.actualBalance !== undefined && (
                  <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs"><span>Actual</span><span className="font-bold tabular-nums">{formatCurrency(shift.actualBalance)}</span></div>
                      <div className={cn("flex justify-between text-xs mt-0.5 font-semibold", (shift.difference ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                        <span>Difference</span>
                        <span className="tabular-nums">{(shift.difference ?? 0) >= 0 ? "+" : ""}{formatCurrency(shift.difference ?? 0)}</span>
                      </div>
                    </div>
                    {(shift.difference ?? 0) >= 0
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      : <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    }
                  </div>
                )}
                {shift.entries.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[var(--muted-foreground)]">Entries</p>
                    {shift.entries.map((e) => {
                      const cfg = ENTRY_CONFIG[e.type];
                      return (
                        <div key={e.id} className="flex items-center gap-2 rounded-lg bg-[var(--muted)]/20 px-3 py-2 text-xs">
                          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md shrink-0", cfg.color)}>{cfg.icon}</span>
                          <span className="font-medium">{cfg.label}</span>
                          <span className="text-[var(--muted-foreground)] flex-1 truncate">{e.description}</span>
                          <span className={cn("font-bold tabular-nums", cfg.direction === "in" ? "text-emerald-600" : "text-red-600")}>
                            {cfg.direction === "in" ? "+" : "−"}{formatCurrency(e.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {shift.notes && <p className="text-xs text-[var(--muted-foreground)] italic">Note: {shift.notes}</p>}
                {onDelete && shift.status === "closed" && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={onDelete}>
                      <Trash2 className="h-3 w-3" />Remove
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function CashRegisterPage() {
  const dispatch = useAppDispatch();
  const { currentShift, shiftHistory } = useAppSelector((s) => s.cashRegister);
  const user = useAppSelector((s) => s.auth?.user);

  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [entryModal, setEntryModal] = useState(false);
  const [openingBal, setOpeningBal] = useState("");
  const [actualBal, setActualBal] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [entryType, setEntryType] = useState<CashEntryType>("cash_in");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDesc, setEntryDesc] = useState("");
  const [entryCategory, setEntryCategory] = useState("");

  const handleOpen = () => {
    if (!openingBal) { toast.error("Enter opening balance"); return; }
    dispatch(openShift({ userId: user?.id ?? "unknown", userName: user?.name ?? "Staff", openingBalance: Number(openingBal) }));
    toast.success("Shift opened");
    setOpenModal(false);
    setOpeningBal("");
  };

  const handleClose = () => {
    if (!actualBal) { toast.error("Count and enter actual balance"); return; }
    dispatch(closeShift({ actualBalance: Number(actualBal), notes: closeNotes.trim() || undefined }));
    toast.success("Shift closed");
    setCloseModal(false);
    setActualBal("");
    setCloseNotes("");
  };

  const handleEntry = () => {
    if (!entryAmount || Number(entryAmount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (!entryDesc.trim()) { toast.error("Enter a description"); return; }
    dispatch(addCashEntry({ type: entryType, amount: Number(entryAmount), description: entryDesc.trim(), category: entryCategory || undefined }));
    toast.success("Entry added");
    setEntryModal(false);
    setEntryAmount("");
    setEntryDesc("");
    setEntryCategory("");
  };

  const totalIn = currentShift?.entries.filter((e) => e.type === "cash_in" || e.type === "sale").reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalOut = currentShift?.entries.filter((e) => e.type === "cash_out" || e.type === "expense" || e.type === "refund").reduce((s, e) => s + e.amount, 0) ?? 0;

  return (
    <RoleGuard permission="cash_register">
      <PageMotion>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cash Register</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Manage cash drawer shifts, cash in/out, and expenses</p>
          </div>
          {!currentShift ? (
            <Button onClick={() => setOpenModal(true)} className="gap-2 shrink-0 mt-2 sm:mt-0"><Unlock className="h-4 w-4" />Open Shift</Button>
          ) : (
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button variant="outline" onClick={() => setEntryModal(true)} className="gap-2"><Plus className="h-4 w-4" />Add Entry</Button>
              <Button variant="destructive" onClick={() => setCloseModal(true)} className="gap-2"><Lock className="h-4 w-4" />Close Shift</Button>
            </div>
          )}
        </div>

        {currentShift ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatsCard title="Opening Balance" value={formatCurrency(currentShift.openingBalance)} icon={<Banknote className="h-5 w-5" />} />
              <StatsCard title="Cash In" value={formatCurrency(totalIn)} animate icon={<TrendingUp className="h-5 w-5" />} />
              <StatsCard title="Cash Out" value={formatCurrency(totalOut)} animate icon={<TrendingDown className="h-5 w-5" />} />
              <StatsCard title="Expected Balance" value={formatCurrency(currentShift.expectedBalance)} animate icon={<DollarSign className="h-5 w-5" />} />
              <StatsCard title="Entries" value={currentShift.entries.length} animate icon={<Receipt className="h-5 w-5" />} />
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Current Shift</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Opened by {currentShift.userName} at {new Date(currentShift.openedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 gap-1"><Unlock className="h-3 w-3" />Active</Badge>
                </div>
                <div className="p-4">
                  {currentShift.entries.length === 0 ? (
                    <EmptyState title="No entries yet" description="Record cash in, cash out, expenses, or sales." icon={<Receipt className="h-6 w-6" />}
                      action={<Button size="sm" onClick={() => setEntryModal(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Entry</Button>} />
                  ) : (
                    <div className="space-y-1.5">
                      <AnimatePresence mode="popLayout">
                        {[...currentShift.entries].reverse().map((e) => {
                          const cfg = ENTRY_CONFIG[e.type];
                          return (
                            <motion.div key={e.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
                              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", cfg.color)}>{cfg.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{cfg.label}</span>
                                  {e.category && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{e.category}</Badge>}
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{e.description}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={cn("text-sm font-bold tabular-nums", cfg.direction === "in" ? "text-emerald-600" : "text-red-600")}>
                                  {cfg.direction === "in" ? "+" : "−"}{formatCurrency(e.amount)}
                                </span>
                                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                                  {new Date(e.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                </p>
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
          </>
        ) : (
          <EmptyState title="No active shift" description="Open a new shift to start recording cash transactions." icon={<Banknote className="h-6 w-6" />}
            action={<Button size="sm" onClick={() => setOpenModal(true)} className="gap-1.5"><Unlock className="h-3.5 w-3.5" />Open Shift</Button>} />
        )}

        {shiftHistory.length > 0 && (
          <div className="space-y-3 mt-2">
            <h2 className="text-lg font-bold">Shift History</h2>
            <AnimatePresence mode="popLayout">
              {shiftHistory.map((s) => (
                <ShiftSummaryCard key={s.id} shift={s} onDelete={() => { dispatch(deleteShiftHistory(s.id)); toast.success("Shift removed"); }} />
              ))}
            </AnimatePresence>
          </div>
        )}

        <Modal open={openModal} onOpenChange={(o) => !o && setOpenModal(false)}>
          <ModalContent>
            <ModalHeader><ModalTitle>Open New Shift</ModalTitle></ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Opening Balance *</label>
                <Input type="number" min={0} step={0.01} value={openingBal} onChange={(e) => setOpeningBal(e.target.value)} placeholder="Count cash in drawer" className="mt-1" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">Count the physical cash in the drawer and enter the total.</p>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button onClick={handleOpen} className="gap-1.5"><Unlock className="h-4 w-4" />Open Shift</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal open={closeModal} onOpenChange={(o) => !o && setCloseModal(false)}>
          <ModalContent>
            <ModalHeader><ModalTitle>Close Shift</ModalTitle></ModalHeader>
            <div className="space-y-4">
              <div className="rounded-lg bg-[var(--muted)]/30 px-4 py-3">
                <div className="flex justify-between text-sm"><span>Expected Balance</span><span className="font-bold tabular-nums">{formatCurrency(currentShift?.expectedBalance ?? 0)}</span></div>
              </div>
              <div>
                <label className="text-sm font-medium">Actual Balance *</label>
                <Input type="number" min={0} step={0.01} value={actualBal} onChange={(e) => setActualBal(e.target.value)} placeholder="Count cash in drawer" className="mt-1" />
              </div>
              {actualBal && (
                <div className={cn("rounded-lg px-4 py-3 text-sm font-semibold flex justify-between",
                  Number(actualBal) - (currentShift?.expectedBalance ?? 0) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                  <span>Difference</span>
                  <span className="tabular-nums">
                    {Number(actualBal) - (currentShift?.expectedBalance ?? 0) >= 0 ? "+" : ""}
                    {formatCurrency(Number(actualBal) - (currentShift?.expectedBalance ?? 0))}
                  </span>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} placeholder="Any discrepancy notes" className="mt-1" />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button variant="destructive" onClick={handleClose} className="gap-1.5"><Lock className="h-4 w-4" />Close Shift</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal open={entryModal} onOpenChange={(o) => !o && setEntryModal(false)}>
          <ModalContent>
            <ModalHeader><ModalTitle>Add Cash Entry</ModalTitle></ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {(["cash_in", "cash_out", "expense", "sale", "refund"] as CashEntryType[]).map((t) => {
                    const cfg = ENTRY_CONFIG[t];
                    return (
                      <button key={t} type="button" onClick={() => setEntryType(t)}
                        className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                          entryType === t ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-[var(--border)] hover:border-[var(--primary)]/30")}>
                        {cfg.icon}{cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input type="number" min={0.01} step={0.01} value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <Input value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="Brief description" className="mt-1" />
              </div>
              {entryType === "expense" && (
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select value={entryCategory} onChange={(e) => setEntryCategory(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20">
                    <option value="">Select category</option>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button onClick={handleEntry} className="gap-1.5"><Plus className="h-4 w-4" />Add Entry</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </PageMotion>
    </RoleGuard>
  );
}
