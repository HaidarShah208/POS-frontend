"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Utensils, Clock, Star, Lock } from "lucide-react";
import type { FloorTable, TableStatus } from "@/types/floor";

type TableNodeProps = {
  table: FloorTable;
  selected: boolean;
  editMode: boolean;
  onClick: () => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
};

const STATUS_STYLES: Record<TableStatus, { bg: string; border: string; text: string; glow: string }> = {
  available: { bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-700", glow: "" },
  occupied: { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", glow: "shadow-blue-200/50" },
  reserved: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700", glow: "shadow-amber-200/50" },
  merged: { bg: "bg-violet-50", border: "border-violet-400", text: "text-violet-700", glow: "" },
  cleaning: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-500", glow: "" },
};

const STATUS_ICON: Record<TableStatus, React.ReactNode> = {
  available: null,
  occupied: <Utensils className="h-3 w-3" />,
  reserved: <Lock className="h-3 w-3" />,
  merged: <Star className="h-3 w-3" />,
  cleaning: <Clock className="h-3 w-3" />,
};

function formatElapsed(since?: string): string {
  if (!since) return "";
  const m = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function TableNode({ table, selected, editMode, onClick, onDragEnd }: TableNodeProps) {
  const style = STATUS_STYLES[table.status];
  const isRound = table.shape === "round" || table.shape === "oval";
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = useCallback(
    (_: unknown, info: { point: { x: number; y: number }; offset: { x: number; y: number } }) => {
      setIsDragging(false);
      if (!onDragEnd) return;
      onDragEnd({
        x: Math.max(0, table.position.x + info.offset.x),
        y: Math.max(0, table.position.y + info.offset.y),
      });
    },
    [onDragEnd, table.position]
  );

  return (
    <motion.div
      ref={nodeRef}
      drag={editMode}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: editMode ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "absolute flex flex-col items-center justify-center border-2 cursor-pointer transition-shadow select-none",
        style.bg,
        style.border,
        style.text,
        isRound ? "rounded-full" : "rounded-xl",
        selected && "ring-2 ring-[var(--primary)] ring-offset-2",
        isDragging && "opacity-80 z-50",
        editMode && "cursor-grab active:cursor-grabbing",
        style.glow && `shadow-lg ${style.glow}`
      )}
      style={{
        left: table.position.x,
        top: table.position.y,
        width: table.width,
        height: table.height,
        transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
      }}
    >
      <span className="text-sm font-bold leading-none">{table.label}</span>
      <div className="flex items-center gap-1 mt-0.5">
        <Users className="h-3 w-3 opacity-60" />
        <span className="text-[10px] font-semibold">
          {table.guestCount ?? 0}/{table.capacity}
        </span>
      </div>
      {STATUS_ICON[table.status] && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-current shadow-sm">
          {STATUS_ICON[table.status]}
        </span>
      )}
      {table.status === "occupied" && table.occupiedSince && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-1.5 py-px text-[8px] font-bold text-white whitespace-nowrap">
          {formatElapsed(table.occupiedSince)}
        </span>
      )}
      {table.status === "reserved" && table.reservedBy && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-1.5 py-px text-[8px] font-bold text-white whitespace-nowrap truncate max-w-[80px]">
          {table.reservedBy}
        </span>
      )}
      {table.assignedWaiter && (
        <span className="absolute -top-2 -left-1.5 rounded-full bg-[var(--primary)] px-1.5 py-px text-[8px] font-bold text-white truncate max-w-[60px]">
          {table.assignedWaiter}
        </span>
      )}
    </motion.div>
  );
}
