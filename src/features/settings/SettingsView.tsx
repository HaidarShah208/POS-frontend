"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  setTax,
  setReceipt,
  setPaymentMethod,
  setPos,
  saveSettings,
} from "@/redux/slices/settingsSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TabId = "general" | "tax" | "receipt" | "payment" | "pos";

const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "tax", label: "Tax & Charges" },
  { id: "receipt", label: "Receipt Designer" },
  { id: "payment", label: "Payment Methods" },
  { id: "pos", label: "POS Preferences" },
];

export function SettingsView() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const handleSave = () => {
    dispatch(saveSettings());
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left nav */}
      <nav className="shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-[var(--border)] lg:pr-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--foreground)] hover:bg-[var(--muted)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content + sticky save */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 space-y-6 pb-24">
        {activeTab === "general" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">General</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Business name, currency, and other general options can go here.</p>
          </motion.section>
        )}

        {activeTab === "tax" && (
          <TaxSection settings={settings.tax} onChange={(p) => { dispatch(setTax(p)); markDirty(); }} />
        )}

        {activeTab === "receipt" && (
          <ReceiptSection settings={settings.receipt} onChange={(p) => { dispatch(setReceipt(p)); markDirty(); }} />
        )}

        {activeTab === "payment" && (
          <PaymentSection methods={settings.paymentMethods} onToggle={(id, enabled) => { dispatch(setPaymentMethod({ id, enabled })); markDirty(); }} />
        )}

        {activeTab === "pos" && (
          <POSSection settings={settings.pos} onChange={(p) => { dispatch(setPos(p)); markDirty(); }} />
        )}
        </div>

        {/* Sticky save */}
        <div className="sticky bottom-4 flex justify-end pt-4">
          <motion.div
            animate={saved ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={handleSave}
              disabled={!dirty}
              className={cn(saved && "bg-emerald-600 hover:bg-emerald-700")}
            >
              {saved ? "Saved!" : "Save changes"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TaxSection({
  settings,
  onChange,
}: {
  settings: { taxName: string; taxPercentage: number; serviceCharge: number; taxEnabled: boolean; serviceChargeEnabled: boolean };
  onChange: (p: Partial<typeof settings>) => void;
}) {
  const subtotal = 100;
  const tax = settings.taxEnabled ? (subtotal * settings.taxPercentage) / 100 : 0;
  const service = settings.serviceChargeEnabled ? (subtotal * settings.serviceCharge) / 100 : 0;
  const total = subtotal + tax + service;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-lg font-semibold">Tax & Service Charges</h2>
      <div className="grid gap-4 max-w-md">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.taxEnabled}
            onChange={(e) => onChange({ taxEnabled: e.target.checked })}
            className="rounded border-[var(--border)]"
          />
          <span className="text-sm">Enable tax</span>
        </label>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Tax name</label>
          <Input
            value={settings.taxName}
            onChange={(e) => onChange({ taxName: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Tax percentage</label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={settings.taxPercentage}
            onChange={(e) => onChange({ taxPercentage: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.serviceChargeEnabled}
            onChange={(e) => onChange({ serviceChargeEnabled: e.target.checked })}
            className="rounded border-[var(--border)]"
          />
          <span className="text-sm">Enable service charge</span>
        </label>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Service charge %</label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={settings.serviceCharge}
            onChange={(e) => onChange({ serviceCharge: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
      </div>
      <div className="rounded-lg border border-[var(--border)] p-4 max-w-md bg-[var(--muted)]/30">
        <p className="text-sm font-medium mb-2">Live preview (subtotal $100)</p>
        <div className="text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {settings.taxEnabled && <div className="flex justify-between"><span>{settings.taxName}</span><span>{formatCurrency(tax)}</span></div>}
          {settings.serviceChargeEnabled && <div className="flex justify-between"><span>Service charge</span><span>{formatCurrency(service)}</span></div>}
          <div className="flex justify-between font-semibold pt-2 border-t border-[var(--border)]"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
      </div>
    </motion.section>
  );
}

function ReceiptSection({
  settings,
  onChange,
}: {
  settings: { logoUrl: string; headerText: string; footerMessage: string; showQrCode: boolean; paperSize: "80mm" | "a4" };
  onChange: (p: Partial<typeof settings>) => void;
}) {
  const is80 = settings.paperSize === "80mm";
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row gap-6"
    >
      <div className="space-y-4 flex-1 max-w-md">
        <h2 className="text-lg font-semibold">Receipt Designer</h2>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Logo URL</label>
          <Input
            value={settings.logoUrl}
            onChange={(e) => onChange({ logoUrl: e.target.value })}
            placeholder="https://..."
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Header text</label>
          <Input
            value={settings.headerText}
            onChange={(e) => onChange({ headerText: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Footer message</label>
          <Input
            value={settings.footerMessage}
            onChange={(e) => onChange({ footerMessage: e.target.value })}
            className="mt-1"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.showQrCode}
            onChange={(e) => onChange({ showQrCode: e.target.checked })}
            className="rounded border-[var(--border)]"
          />
          <span className="text-sm">Show QR code</span>
        </label>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Paper size</label>
          <div className="flex gap-2 mt-1">
            <Button
              type="button"
              variant={is80 ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ paperSize: "80mm" })}
            >
              80mm
            </Button>
            <Button
              type="button"
              variant={!is80 ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ paperSize: "a4" })}
            >
              A4
            </Button>
          </div>
        </div>
      </div>
      <div className={cn("border border-[var(--border)] rounded-lg bg-white text-black p-4 shrink-0", is80 ? "w-[280px]" : "w-[210px]")}>
        <p className="text-xs text-center text-gray-500 mb-2">Live preview</p>
        {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="h-10 mx-auto mb-2 object-contain" /> : <div className="h-10 mx-auto mb-2 flex items-center justify-center text-gray-400 text-xs">Logo</div>}
        <p className="text-center text-sm font-medium mb-2">{settings.headerText || "Header"}</p>
        <div className="text-xs space-y-1 border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between"><span>Item A x 2</span><span>$10.00</span></div>
          <div className="flex justify-between"><span>Item B x 1</span><span>$5.00</span></div>
        </div>
        <div className="text-xs space-y-1 border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between"><span>Total</span><span>$15.00</span></div>
        </div>
        {settings.showQrCode && <div className="mt-2 w-12 h-12 mx-auto bg-gray-200 rounded flex items-center justify-center text-[10px]">QR</div>}
        <p className="text-center text-xs mt-2">{settings.footerMessage || "Footer"}</p>
      </div>
    </motion.section>
  );
}

function PaymentSection({
  methods,
  onToggle,
}: {
  methods: { id: string; name: string; enabled: boolean }[];
  onToggle: (id: string, enabled: boolean) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">Payment Methods</h2>
      <div className="space-y-3 max-w-md">
        {methods.map((m) => (
          <label key={m.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[var(--border)]">
            <span className="font-medium">{m.name}</span>
            <input
              type="checkbox"
              checked={m.enabled}
              onChange={(e) => onToggle(m.id, e.target.checked)}
              className="rounded border-[var(--border)]"
            />
          </label>
        ))}
        <Button type="button" variant="outline" size="sm" disabled title="Add custom (UI only)">
          + Add custom payment method
        </Button>
      </div>
    </motion.section>
  );
}

function POSSection({
  settings,
  onChange,
}: {
  settings: { defaultOrderType: string; autoPrintReceipt: boolean; soundOnNewOrder: boolean; kitchenAutoAccept: boolean };
  onChange: (p: Partial<typeof settings>) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">POS Preferences</h2>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Default order type</label>
          <select
            value={settings.defaultOrderType}
            onChange={(e) => onChange({ defaultOrderType: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="dine-in">Dine-in</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        <label className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[var(--border)]">
          <span className="text-sm">Auto print receipt</span>
          <input type="checkbox" checked={settings.autoPrintReceipt} onChange={(e) => onChange({ autoPrintReceipt: e.target.checked })} className="rounded border-[var(--border)]" />
        </label>
        <label className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[var(--border)]">
          <span className="text-sm">Sound on new order</span>
          <input type="checkbox" checked={settings.soundOnNewOrder} onChange={(e) => onChange({ soundOnNewOrder: e.target.checked })} className="rounded border-[var(--border)]" />
        </label>
        <label className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[var(--border)]">
          <span className="text-sm">Kitchen auto accept</span>
          <input type="checkbox" checked={settings.kitchenAutoAccept} onChange={(e) => onChange({ kitchenAutoAccept: e.target.checked })} className="rounded border-[var(--border)]" />
        </label>
      </div>
    </motion.section>
  );
}
