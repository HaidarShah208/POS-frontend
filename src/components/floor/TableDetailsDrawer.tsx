"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  updateTableStatus,
  assignWaiter,
  setTableNotes,
  reserveTable,
  splitTable,
  selectTable,
} from "@/redux/slices/floorSlice";
import { cn } from "@/lib/utils";
import type { FloorTable, TableStatus } from "@/types/floor";
import {
  X,
  Users,
  Clock,
  UserCheck,
  StickyNote,
  CalendarClock,
  Merge,
  Split,
  ArrowRightLeft,
} from "lucide-react";

type TableDetailsDrawerProps = {
  table: FloorTable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STATUS_OPTIONS: { value: TableStatus; label: string; color: string }[] = [
  { value: "available", label: "Available", color: "bg-emerald-500" },
  { value: "occupied", label: "Occupied", color: "bg-blue-500" },
  { value: "reserved", label: "Reserved", color: "bg-amber-500" },
  { value: "cleaning", label: "Cleaning", color: "bg-gray-400" },
];

const STATUS_BADGE: Record<TableStatus, "success" | "default" | "warning" | "secondary" | "destructive"> = {
  available: "success",
  occupied: "default",
  reserved: "warning",
  merged: "secondary",
  cleaning: "secondary",
};

export function TableDetailsDrawer({ table, open, onOpenChange }: TableDetailsDrawerProps) {
  const dispatch = useAppDispatch();
  const [guestCount, setGuestCount] = useState("");
  const [waiter, setWaiter] = useState("");
  const [notes, setNotes] = useState("");
  const [resName, setResName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resGuests, setResGuests] = useState("");
  const [resDate, setResDate] = useState("");
  const [resTime, setResTime] = useState("");
  const [showReserveForm, setShowReserveForm] = useState(false);

  if (!table) return null;

  const handleStatusChange = (status: TableStatus) => {
    dispatch(updateTableStatus({
      id: table.id,
      status,
      guestCount: status === "occupied" ? (Number(guestCount) || 1) : undefined,
    }));
    if (status !== "occupied") setGuestCount("");
  };

  const handleAssignWaiter = () => {
    if (!waiter.trim()) return;
    dispatch(assignWaiter({ tableId: table.id, waiter: waiter.trim() }));
    setWaiter("");
  };

  const handleSaveNotes = () => {
    dispatch(setTableNotes({ tableId: table.id, notes }));
  };

  const handleReserve = () => {
    if (!resName.trim() || !resDate || !resTime) return;
    dispatch(reserveTable({
      tableId: table.id,
      customerName: resName.trim(),
      customerPhone: resPhone.trim() || undefined,
      guestCount: Number(resGuests) || table.capacity,
      date: resDate,
      time: resTime,
    }));
    setResName("");
    setResPhone("");
    setResGuests("");
    setResDate("");
    setResTime("");
    setShowReserveForm(false);
  };

  const handleSplit = () => {
    dispatch(splitTable(table.id));
  };

  const elapsed = table.occupiedSince
    ? Math.floor((Date.now() - new Date(table.occupiedSince).getTime()) / 60000)
    : 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="w-full max-w-md">
        <DrawerHeader className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <DrawerTitle className="text-lg">{table.label}</DrawerTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={STATUS_BADGE[table.status]}>
                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
              </Badge>
              <span className="text-xs text-[var(--muted-foreground)]">
                Capacity: {table.capacity} · {table.shape}
              </span>
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {table.status === "occupied" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <Clock className="h-4 w-4" />
                Occupied for {elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`}
              </div>
              {table.guestCount && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Users className="h-4 w-4" />
                  {table.guestCount} guest{table.guestCount !== 1 ? "s" : ""}
                </div>
              )}
              {table.assignedWaiter && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <UserCheck className="h-4 w-4" />
                  Waiter: {table.assignedWaiter}
                </div>
              )}
            </div>
          )}

          {table.status === "reserved" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <CalendarClock className="h-4 w-4" />
                Reserved
              </div>
              {table.reservedBy && (
                <p className="text-sm text-amber-600">By: {table.reservedBy}</p>
              )}
              {table.reservedAt && (
                <p className="text-sm text-amber-600">
                  At: {new Date(table.reservedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
            </div>
          )}

          {table.mergedWith && table.mergedWith.length > 0 && (
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-violet-700">
                <Merge className="h-4 w-4" />
                Merged with {table.mergedWith.length} table{table.mergedWith.length > 1 ? "s" : ""}
              </div>
              <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={handleSplit}>
                <Split className="h-3.5 w-3.5" />
                Split Tables
              </Button>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Set Status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={table.status === opt.value ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 justify-start"
                  onClick={() => handleStatusChange(opt.value)}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", opt.color)} />
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {table.status === "occupied" && (
            <div>
              <p className="text-sm font-medium mb-2">Guests</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={table.capacity}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder={`Max ${table.capacity}`}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const c = Number(guestCount);
                    if (c > 0) dispatch(updateTableStatus({ id: table.id, status: "occupied", guestCount: c }));
                  }}
                >
                  Update
                </Button>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Assign Waiter</p>
            <div className="flex gap-2">
              <Input
                value={waiter}
                onChange={(e) => setWaiter(e.target.value)}
                placeholder={table.assignedWaiter || "Enter waiter name"}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAssignWaiter} disabled={!waiter.trim()}>
                <UserCheck className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Notes</p>
            <div className="flex gap-2">
              <Input
                value={notes || table.notes || ""}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add table notes"
                className="flex-1"
              />
              <Button size="sm" onClick={handleSaveNotes}>
                <StickyNote className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!showReserveForm && table.status === "available" && (
            <Button variant="outline" className="w-full gap-1.5" onClick={() => setShowReserveForm(true)}>
              <CalendarClock className="h-4 w-4" />
              Make Reservation
            </Button>
          )}

          {showReserveForm && (
            <div className="rounded-lg border border-[var(--border)] p-3 space-y-3">
              <p className="text-sm font-medium">New Reservation</p>
              <Input value={resName} onChange={(e) => setResName(e.target.value)} placeholder="Customer name" />
              <Input value={resPhone} onChange={(e) => setResPhone(e.target.value)} placeholder="Phone (optional)" />
              <Input type="number" value={resGuests} onChange={(e) => setResGuests(e.target.value)} placeholder={`Guests (max ${table.capacity})`} />
              <div className="flex gap-2">
                <Input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} className="flex-1" />
                <Input type="time" value={resTime} onChange={(e) => setResTime(e.target.value)} className="flex-1" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReserve} disabled={!resName.trim() || !resDate || !resTime}>
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReserveForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
