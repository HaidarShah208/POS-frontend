"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
};

type DataTableProps<T extends object> = {
  columns: DataTableColumn<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
  mobileCardView?: (row: T) => React.ReactNode;
};

export function DataTable<T extends object>(props: DataTableProps<T>) {
  const {
    columns,
    data,
    searchPlaceholder = "Search...",
    searchKeys = [],
    pageSize = 10,
    emptyMessage = "No data",
    onRowClick,
    keyExtractor,
    mobileCardView,
  } = props;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    if (!search || searchKeys.length === 0) return data;
    const s = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => {
        const v = row[k];
        return typeof v === "string" && v.toLowerCase().includes(s);
      })
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.id === sortKey);
    if (!col || col.sortable !== true) return filtered;
    const accessor = col.accessor;
    return [...filtered].sort((a, b) => {
      const av = typeof accessor === "function" ? "" : a[accessor];
      const bv = typeof accessor === "function" ? "" : b[accessor];
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const getCell = (row: T, col: DataTableColumn<T>) => {
    if (typeof col.accessor === "function") return col.accessor(row);
    const v = row[col.accessor];
    return v != null ? String(v) : "";
  };

  const toggleSort = (id: string) => {
    if (sortKey === id) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(id);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      {searchKeys.length > 0 && (
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "text-left font-medium px-4 py-3",
                    col.sortable && "cursor-pointer select-none hover:bg-[var(--muted)]",
                    col.className
                  )}
                  onClick={() => col.sortable && toggleSort(col.id)}
                >
                  {col.header}
                  {col.sortable && sortKey === col.id && (sortDir === "asc" ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <motion.tr
                  key={keyExtractor(row)}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-4 py-3", col.className)}>
                      {getCell(row, col)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      {mobileCardView && (
        <div className="md:hidden space-y-3">
          {paginated.length === 0 ? (
            <p className="text-center py-8 text-[var(--muted-foreground)]">{emptyMessage}</p>
          ) : (
            paginated.map((row) => (
              <motion.div
                key={keyExtractor(row)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer" : ""}
              >
                {mobileCardView(row)}
              </motion.div>
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            Page {page + 1} of {totalPages} ({sorted.length} items)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
