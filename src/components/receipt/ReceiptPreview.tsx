"use client";

import { forwardRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api/index";
import type { SettingsState } from "@/types/settings";
import { QrCode, Barcode } from "lucide-react";

type ReceiptPreviewProps = {
  order: Order;
  settings: SettingsState;
  summary?: { subtotal: number; tax: number; discountAmount: number; grandTotal: number } | null;
  paperSize?: "thermal" | "a4";
  className?: string;
};

export const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(
  function ReceiptPreview({ order, settings, summary, paperSize, className }, ref) {
    const general = settings.general;
    const receipt = settings.receipt;
    const size = paperSize ?? (receipt.paperSize === "a4" ? "a4" : "thermal");
    const s = summary ?? { subtotal: order.subtotal, tax: order.tax, discountAmount: order.discount, grandTotal: order.grandTotal };
    const createdAt = new Date(order.createdAt);
    const dateStr = createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const timeStr = createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    return (
      <div ref={ref} className={cn("bg-white text-black mx-auto", size === "thermal" ? "w-[280px] text-[11px]" : "w-full max-w-md text-xs", className)}>
        <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-gray-300">
          {receipt.logoUrl && (
            <img src={receipt.logoUrl} alt="Logo" className="h-10 mx-auto mb-1 object-contain" />
          )}
          <p className="font-bold text-sm">{general.businessName || "Restaurant POS"}</p>
          {receipt.headerText && <p className="text-gray-500 text-[10px]">{receipt.headerText}</p>}
        </div>

        <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-300 text-[10px] text-gray-500">
          <div>
            <p className="font-medium text-black">{order.orderNumber}</p>
            <p className="capitalize">{order.orderType.replace("-", " ")}</p>
          </div>
          <div className="text-right">
            <p>{dateStr}</p>
            <p>{timeStr}</p>
          </div>
        </div>

        {order.tokenNumber && (
          <div className="text-center py-2 border-b border-dashed border-gray-300">
            <p className="text-[10px] text-gray-500">Token</p>
            <p className="text-2xl font-black tracking-wider">{order.tokenNumber}</p>
          </div>
        )}

        <div className="py-2 border-b border-dashed border-gray-300">
          <div className="flex justify-between text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
            <span>Item</span>
            <div className="flex gap-4">
              <span className="w-6 text-right">Qty</span>
              <span className="w-16 text-right">Amount</span>
            </div>
          </div>
          {(order.items ?? []).map((item, i) => {
            const lineTotal = item.price * item.quantity;
            return (
              <div key={item.id ?? i} className="flex justify-between py-1 px-1">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{item.name}</span>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-[9px] text-gray-400 mt-0.5">{item.modifiers.map((m) => m.name).join(", ")}</p>
                  )}
                  {item.note && <p className="text-[9px] italic text-gray-400">{item.note}</p>}
                </div>
                <div className="flex gap-4 shrink-0">
                  <span className="w-6 text-right tabular-nums">{item.quantity}</span>
                  <span className="w-16 text-right tabular-nums">{formatCurrency(lineTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="py-2 space-y-1 px-1">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="tabular-nums">{formatCurrency(s.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="tabular-nums">{formatCurrency(s.tax)}</span></div>
          {s.discountAmount > 0 && (
            <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="tabular-nums text-red-600">-{formatCurrency(s.discountAmount)}</span></div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200">
            <span>Total</span><span className="tabular-nums">{formatCurrency(s.grandTotal)}</span>
          </div>
        </div>

        <div className="flex justify-between py-2 border-t border-dashed border-gray-300 text-[10px] text-gray-500 px-1">
          <span>Payment: <span className="capitalize font-medium text-black">{order.paymentMethod}</span></span>
          <span>Status: <span className="capitalize font-medium text-black">{order.status}</span></span>
        </div>

        {receipt.showQrCode && (
          <div className="flex flex-col items-center py-3 border-t border-dashed border-gray-300">
            <div className="flex items-center justify-center h-14 w-14 rounded-lg border border-gray-200 bg-gray-50">
              <QrCode className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-[9px] text-gray-400 mt-1">{order.orderNumber}</p>
          </div>
        )}

        {order.orderNumber && (
          <div className="flex flex-col items-center py-2 border-t border-dashed border-gray-300">
            <div className="flex items-center gap-1 text-gray-400">
              <Barcode className="h-4 w-4" />
              <span className="text-[10px] font-mono tracking-widest">{order.orderNumber}</span>
            </div>
          </div>
        )}

        {receipt.footerMessage && (
          <div className="text-center py-2 border-t border-dashed border-gray-300">
            <p className="text-[10px] text-gray-500">{receipt.footerMessage}</p>
          </div>
        )}

        <div className="text-center py-2 text-[9px] text-gray-400">
          <p>Powered by Restaurant POS</p>
        </div>
      </div>
    );
  }
);
