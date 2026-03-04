"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  setTax,
  setReceipt,
  setPaymentMethod,
  setPos,
  setGeneral,
  saveSettings,
} from "@/redux/slices/settingsSlice";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/redux/api/productsEndpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { GeneralSettings, POSPreferences } from "@/types/settings";

type TabId = "general" | "categories" | "tax" | "receipt" | "payment" | "pos";

const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "categories", label: "Categories" },
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

  const handleSave = async () => {
    try {
      // If logo is still a data URL, upload it to the backend first.
      const logo = settings.receipt.logoUrl;
      if (logo && logo.startsWith("data:")) {
        const res = await fetch("/api/uploads/logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: logo }),
        });
        if (res.ok) {
          const json = (await res.json()) as { url?: string };
          if (json.url) {
            dispatch(setReceipt({ logoUrl: json.url }));
          }
        }
      }
    } catch {
      // Ignore upload errors; user can retry.
    }

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
          <GeneralSection
            settings={settings.general}
            onChange={(p) => { dispatch(setGeneral(p)); markDirty(); }}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesSection />
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

function GeneralSection({
  settings,
  onChange,
}: {
  settings: GeneralSettings;
  onChange: (p: Partial<GeneralSettings>) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">General</h2>
      <p className="text-sm text-[var(--muted-foreground)]">Business name and currency. Changes apply after you click Save changes.</p>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-sm font-medium block mb-1">Business name</label>
          <Input
            value={settings.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            placeholder="e.g. My Restaurant"
            className="bg-background"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Currency symbol</label>
          <Input
            value={settings.currencySymbol}
            onChange={(e) => onChange({ currencySymbol: e.target.value })}
            placeholder="e.g. Rs. or $"
            className="bg-background"
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Used across POS, receipts, and reports (e.g. Rs., $, €).</p>
        </div>
      </div>
    </motion.section>
  );
}

function CategoriesSection() {
  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const slugValue = slug.trim() || trimmedName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      await createCategory({ name: trimmedName, slug: slugValue, sortOrder }).unwrap();
      setName("");
      setSlug("");
      setSortOrder(categories.length);
    } catch {
      // error toast or inline message
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-lg font-semibold">Categories</h2>
      <p className="text-sm text-[var(--muted-foreground)]">Add categories for your products. They will appear in the product form dropdown.</p>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 max-w-2xl">
        <div className="min-w-[180px]">
          <label className="text-sm font-medium block mb-1">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beverages"
            className="bg-background"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="text-sm font-medium block mb-1">Slug (optional)</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Auto from name"
            className="bg-background"
          />
        </div>
        <div className="w-24">
          <label className="text-sm font-medium block mb-1">Order</label>
          <Input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            className="bg-background"
          />
        </div>
        <Button type="submit" disabled={!name.trim() || creating}>
          {creating ? "Adding…" : "Add category"}
        </Button>
      </form>

      {isLoading ? (
        <div className="h-24 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/30 max-w-2xl" />
      ) : categories.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No categories yet. Add one above.</p>
      ) : (
        <ul className="space-y-2 max-w-2xl">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg border border-[var(--border)] bg-background"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-sm text-[var(--muted-foreground)]">{c.slug}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[var(--destructive)] hover:text-[var(--destructive)]"
                onClick={() => deleteCategory(c.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
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
  const fileInputId = "receipt-logo-input";

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (value) onChange({ logoUrl: value });
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row gap-6"
    >
      <div className="space-y-4 flex-1 max-w-md">
        <h2 className="text-lg font-semibold">Receipt Designer</h2>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] block mb-1">Logo</label>
          <label
            htmlFor={fileInputId}
            className="mt-1 flex h-20 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)] overflow-hidden"
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
            ) : (
              <span>Click to upload logo</span>
            )}
          </label>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
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
          <div className="flex justify-between"><span>Item A x 2</span><span>Rs. 10.00</span></div>
          <div className="flex justify-between"><span>Item B x 1</span><span>Rs. 5.00</span></div>
        </div>
        <div className="text-xs space-y-1 border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between"><span>Total</span><span>Rs. 15.00</span></div>
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
    
      </div>
    </motion.section>
  );
}

function POSSection({
  settings,
  onChange,
}: {
  settings: POSPreferences;
  onChange: (p: Partial<POSPreferences>) => void;
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
            onChange={(e) => onChange({ defaultOrderType: e.target.value as POSPreferences["defaultOrderType"] })}
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
      
      </div>
    </motion.section>
  );
}
