import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SETTINGS_STORAGE_KEY = "pos-settings";

function getCurrencySymbol(): string {
  if (typeof window === "undefined") return "Rs.";
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { general?: { currencySymbol?: string } }) : null;
    const symbol = parsed?.general?.currencySymbol?.trim();
    return symbol || "Rs.";
  } catch {
    return "Rs.";
  }
}

export function formatCurrency(value: number): string {
  const symbol = getCurrencySymbol();
  return symbol + " " + new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
