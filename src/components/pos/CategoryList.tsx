"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryListProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function CategoryList({ categories, activeId, onSelect, loading }: CategoryListProps) {
  if (loading) {
    return (
      <nav className="flex flex-col gap-2 p-2 scroll-area-thin overflow-y-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </nav>
    );
  }
  return (
    <nav className="flex flex-col gap-1 p-2 scroll-area-thin overflow-y-auto">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            "pos-touch rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors active:scale-[0.98]",
            activeId === cat.id
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--foreground)] hover:bg-[var(--border)]"
          )}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
