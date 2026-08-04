"use client";

import { useMemo, useState } from "react";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableNode } from "@/components/floor/TableNode";
import { TableDetailsDrawer } from "@/components/floor/TableDetailsDrawer";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  setActiveFloor,
  selectTable,
  toggleEditMode,
  updateTablePosition,
  updateTableStatus,
  addTable,
} from "@/redux/slices/floorSlice";
import { cn } from "@/lib/utils";
import type { TableStatus } from "@/types/floor";
import {
  Search,
  LayoutGrid,
  Armchair,
  Users,
  Clock,
  Lock,
  CheckCircle2,
  Pencil,
  Plus,
  Maximize2,
  SprayCan,
} from "lucide-react";

type StatusFilter = "all" | TableStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "all", label: "All", icon: <LayoutGrid className="h-3.5 w-3.5" />, color: "" },
  { id: "available", label: "Available", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-600" },
  { id: "occupied", label: "Occupied", icon: <Armchair className="h-3.5 w-3.5" />, color: "text-blue-600" },
  { id: "reserved", label: "Reserved", icon: <Lock className="h-3.5 w-3.5" />, color: "text-amber-600" },
  { id: "cleaning", label: "Cleaning", icon: <SprayCan className="h-3.5 w-3.5" />, color: "text-gray-500" },
];

export default function FloorPage() {
  const dispatch = useAppDispatch();
  const { floors, tables, activeFloorId, selectedTableId, editMode } = useAppSelector((s) => s.floor);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const floorTables = useMemo(
    () => tables.filter((t) => t.floorId === activeFloorId),
    [tables, activeFloorId]
  );

  const filteredTables = useMemo(() => {
    let result = floorTables;
    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.number.toString().includes(q) ||
          (t.assignedWaiter && t.assignedWaiter.toLowerCase().includes(q)) ||
          (t.reservedBy && t.reservedBy.toLowerCase().includes(q))
      );
    }
    return result;
  }, [floorTables, statusFilter, search]);

  const selectedTable = selectedTableId ? tables.find((t) => t.id === selectedTableId) ?? null : null;

  const stats = useMemo(() => {
    const all = floorTables;
    return {
      total: all.length,
      available: all.filter((t) => t.status === "available").length,
      occupied: all.filter((t) => t.status === "occupied").length,
      reserved: all.filter((t) => t.status === "reserved").length,
      totalCapacity: all.reduce((s, t) => s + t.capacity, 0),
      currentGuests: all.reduce((s, t) => s + (t.guestCount ?? 0), 0),
    };
  }, [floorTables]);

  const canvasWidth = useMemo(() => {
    if (filteredTables.length === 0) return 600;
    return Math.max(600, ...filteredTables.map((t) => t.position.x + t.width + 40));
  }, [filteredTables]);

  const canvasHeight = useMemo(() => {
    if (filteredTables.length === 0) return 500;
    return Math.max(500, ...filteredTables.map((t) => t.position.y + t.height + 60));
  }, [filteredTables]);

  const handleAddTable = () => {
    const num = tables.length + 1;
    dispatch(addTable({
      number: num,
      label: `T${num}`,
      shape: "square",
      capacity: 4,
      status: "available",
      position: { x: 60 + Math.random() * 200, y: 60 + Math.random() * 200 },
      width: 80,
      height: 80,
      rotation: 0,
      floorId: activeFloorId,
    }));
  };

  return (
    <RoleGuard permission="floor">
      <PageMotion>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader title="Floor Plan" description="Manage restaurant tables and seating" />
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => dispatch(toggleEditMode())}
            >
              <Pencil className="h-3.5 w-3.5" />
              {editMode ? "Done Editing" : "Edit Layout"}
            </Button>
            {editMode && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddTable}>
                <Plus className="h-3.5 w-3.5" />
                Add Table
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tables"
            value={stats.total}
            animate
            icon={<LayoutGrid className="h-5 w-5" />}
            subtitle={`${stats.totalCapacity} total seats`}
          />
          <StatsCard
            title="Available"
            value={stats.available}
            animate
            icon={<CheckCircle2 className="h-5 w-5" />}
            subtitle={`${stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}% free`}
          />
          <StatsCard
            title="Occupied"
            value={stats.occupied}
            animate
            icon={<Armchair className="h-5 w-5" />}
            subtitle={`${stats.currentGuests} guests seated`}
          />
          <StatsCard
            title="Reserved"
            value={stats.reserved}
            animate
            icon={<Clock className="h-5 w-5" />}
            subtitle="Upcoming"
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {floors.map((f) => (
              <Button
                key={f.id}
                variant={activeFloorId === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => dispatch(setActiveFloor(f.id))}
              >
                {f.name}
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">
                  {tables.filter((t) => t.floorId === f.id).length}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tables..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    statusFilter === f.id
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  )}
                >
                  <span className={cn(statusFilter === f.id ? "" : f.color)}>{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-auto">
          {filteredTables.length === 0 ? (
            <div className="py-20">
              <EmptyState
                title="No tables found"
                description={
                  search || statusFilter !== "all"
                    ? "Try adjusting your search or filters."
                    : "Add tables using the Edit Layout button."
                }
                icon={<LayoutGrid className="h-10 w-10" />}
              />
            </div>
          ) : (
            <div
              className="relative"
              style={{ width: canvasWidth, height: canvasHeight, minWidth: "100%" }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              {filteredTables.map((table) => (
                <TableNode
                  key={table.id}
                  table={table}
                  selected={selectedTableId === table.id}
                  editMode={editMode}
                  onClick={() => dispatch(selectTable(table.id))}
                  onDragEnd={
                    editMode
                      ? (pos) => dispatch(updateTablePosition({ id: table.id, position: pos }))
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            Available
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-400" />
            Occupied
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            Reserved
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-violet-400" />
            Merged
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gray-300" />
            Cleaning
          </div>
        </div>

        <TableDetailsDrawer
          table={selectedTable}
          open={selectedTableId !== null}
          onOpenChange={(open) => { if (!open) dispatch(selectTable(null)); }}
        />
      </PageMotion>
    </RoleGuard>
  );
}
