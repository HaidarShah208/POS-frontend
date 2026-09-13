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

/**
 * Payment receipts are now stored on Supabase Storage and returned as full
 * URLs. Older records (uploaded before that migration) only have a bare
 * filename served from the backend's local-disk route.
 */
export function resolveReceiptUrl(receiptImage: string, backendUrl: string): string {
  if (/^https?:\/\//i.test(receiptImage)) return receiptImage;
  return `${backendUrl}/api/files/receipt/${receiptImage}`;
}
