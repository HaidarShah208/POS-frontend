import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/types/api/index";
import type { SettingsState } from "@/types/settings";

type ReceiptSummary = { subtotal: number; tax: number; discountAmount: number; grandTotal: number };

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function buildReceiptHtml(order: Order, settings: SettingsState, summary?: ReceiptSummary | null): string {
  const general = settings.general;
  const receipt = settings.receipt;
  const businessName = esc(general.businessName || "Restaurant POS");
  const s = summary ?? { subtotal: order.subtotal, tax: order.tax, discountAmount: order.discount, grandTotal: order.grandTotal };
  const createdAt = new Date(order.createdAt);
  const dateStr = `${String(createdAt.getDate()).padStart(2, "0")}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${createdAt.getFullYear()}`;
  const timeStr = createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const paperWidth = receipt.paperSize === "a4" ? "210mm" : "80mm";

  const itemsRows = (order.items ?? []).map((item) =>
    `<tr><td style="padding:3px 0">${esc(item.name)}${item.modifiers?.length ? `<br><span style="font-size:9px;color:#9ca3af">${item.modifiers.map((m) => esc(m.name)).join(", ")}</span>` : ""}${item.note ? `<br><span style="font-size:9px;font-style:italic;color:#9ca3af">${esc(item.note)}</span>` : ""}</td><td style="text-align:center;padding:3px 0">${item.quantity}</td><td style="text-align:right;padding:3px 0">${formatCurrency(item.price * item.quantity)}</td></tr>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${esc(order.orderNumber)}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif;padding:16px}
.receipt{width:${paperWidth};max-width:100%;margin:0 auto;font-size:12px;color:#111827}
.center{text-align:center}.muted{color:#6b7280}.sep{border-top:1px dashed #d1d5db;margin:8px 0}
table{width:100%;border-collapse:collapse}
.logo{max-height:48px;margin:0 auto 6px;display:block;object-fit:contain}
.token{font-size:28px;font-weight:900;letter-spacing:2px;margin:4px 0}
.barcode{font-family:monospace;letter-spacing:4px;font-size:11px;color:#6b7280}
@media print{body{padding:0}.no-print{display:none!important}}</style></head><body>
<div class="receipt">
<div class="center">
${receipt.logoUrl ? `<img src="${receipt.logoUrl}" alt="Logo" class="logo"/>` : ""}
<div style="font-weight:700;font-size:14px;margin-bottom:2px">${businessName}</div>
${receipt.headerText ? `<div class="muted" style="font-size:10px;margin-bottom:4px">${esc(receipt.headerText)}</div>` : ""}
</div>
<div class="sep"></div>
<div style="display:flex;justify-content:space-between;font-size:10px;color:#6b7280">
<div><strong style="color:#111827">${esc(order.orderNumber)}</strong><br><span style="text-transform:capitalize">${order.orderType.replace("-"," ")}</span></div>
<div style="text-align:right">${dateStr}<br>${timeStr}</div>
</div>
${order.tokenNumber ? `<div class="sep"></div><div class="center"><div style="font-size:9px;color:#6b7280">Token</div><div class="token">${esc(order.tokenNumber)}</div></div>` : ""}
<div class="sep"></div>
<table><thead><tr style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:4px 0">Item</th><th style="text-align:center;padding:4px 0">Qty</th><th style="text-align:right;padding:4px 0">Amount</th></tr></thead>
<tbody>${itemsRows}</tbody></table>
<div class="sep"></div>
<table><tbody>
<tr><td style="padding:2px 0;color:#6b7280">Subtotal</td><td style="text-align:right;padding:2px 0">${formatCurrency(s.subtotal)}</td></tr>
<tr><td style="padding:2px 0;color:#6b7280">Tax</td><td style="text-align:right;padding:2px 0">${formatCurrency(s.tax)}</td></tr>
${s.discountAmount ? `<tr><td style="padding:2px 0;color:#6b7280">Discount</td><td style="text-align:right;padding:2px 0;color:#dc2626">-${formatCurrency(s.discountAmount)}</td></tr>` : ""}
<tr style="border-top:1px solid #e5e7eb"><td style="padding:4px 0;font-weight:700;font-size:14px">Total</td><td style="text-align:right;padding:4px 0;font-weight:700;font-size:14px">${formatCurrency(s.grandTotal)}</td></tr>
</tbody></table>
<div class="sep"></div>
<div style="display:flex;justify-content:space-between;font-size:10px;color:#6b7280">
<span>Payment: <strong style="color:#111827;text-transform:capitalize">${order.paymentMethod}</strong></span>
<span>Status: <strong style="color:#111827;text-transform:capitalize">${order.status}</strong></span>
</div>
${receipt.showQrCode ? `<div class="sep"></div><div class="center"><div style="width:56px;height:56px;border:1px solid #e5e7eb;border-radius:8px;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:10px;background:#f9fafb">QR</div><div style="font-size:9px;color:#9ca3af;margin-top:4px">${esc(order.orderNumber)}</div></div>` : ""}
<div class="sep"></div>
<div class="center barcode">${esc(order.orderNumber)}</div>
${receipt.footerMessage ? `<div class="sep"></div><div class="center muted" style="font-size:10px">${esc(receipt.footerMessage)}</div>` : ""}
<div style="text-align:center;font-size:9px;color:#9ca3af;margin-top:8px">Powered by Restaurant POS</div>
</div>
<div class="center no-print" style="margin-top:16px"><button onclick="window.print()" style="padding:8px 24px;font-size:13px;border:1px solid #d1d5db;border-radius:8px;cursor:pointer;background:#fff">Print</button></div>
</body></html>`;
}

export function printReceipt(order: Order, settings: SettingsState, summary?: ReceiptSummary | null) {
  if (typeof window === "undefined") return;
  const html = buildReceiptHtml(order, settings, summary);
  const w = window.open("", "_blank", "width=420,height=700");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export function downloadReceiptPDF(order: Order, settings: SettingsState, summary?: ReceiptSummary | null) {
  if (typeof window === "undefined") return;
  const html = buildReceiptHtml(order, settings, summary);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${order.orderNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
