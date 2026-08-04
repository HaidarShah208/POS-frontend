"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2,
  FolderOpen,
  Receipt,
  CreditCard,
  SlidersHorizontal,
  Save,
  Check,
  Plus,
  Trash2,
  Upload,
  Banknote,
  Smartphone,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Printer,
  Volume2,
  ChefHat,
} from "lucide-react";
import type { GeneralSettings, POSPreferences } from "@/types/settings";

type TabId = "general" | "categories" | "tax" | "receipt" | "payment" | "pos";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Building2 className="h-4 w-4" /> },
  { id: "categories", label: "Categories", icon: <FolderOpen className="h-4 w-4" /> },
  { id: "receipt", label: "Receipt", icon: <Receipt className="h-4 w-4" /> },
  { id: "payment", label: "Payment", icon: <CreditCard className="h-4 w-4" /> },
  { id: "pos", label: "POS", icon: <SlidersHorizontal className="h-4 w-4" /> },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  icon,
  children,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

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

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

  const apiBase = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "")
    : "";

  const handleSave = async () => {
    let logoUploadFailed = false;
    try {
      if (pendingLogoFile) {
        const formData = new FormData();
        formData.append("logo", pendingLogoFile);
        const uploadUrl = apiBase ? `${apiBase}/api/uploads/logo` : "/api/uploads/logo";
        const res = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const json = (await res.json()) as { filename?: string };
          if (json.filename) {
            const logoUrl = apiBase ? `${apiBase}/api/files/logo/${json.filename}` : `/api/files/logo/${json.filename}`;
            dispatch(setReceipt({ logoUrl }));
          }
          setPendingLogoFile(null);
        } else {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          const msg = res.status === 413 || /file size|too large/i.test(data?.error ?? "")
            ? "Max file size is 2MB only"
            : data?.error ?? "Logo upload failed";
          toast.error(msg);
          logoUploadFailed = true;
        }
      }
    } catch {
      toast.error("Logo upload failed");
      logoUploadFailed = true;
    }

    if (!logoUploadFailed) {
      dispatch(saveSettings());
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <PageMotion>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Settings" description="Manage your restaurant configuration" />
        <motion.div animate={saved ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}>
          <Button
            onClick={handleSave}
            disabled={!dirty}
            className={cn("gap-2", saved && "bg-emerald-600 hover:bg-emerald-700")}
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved!" : "Save changes"}
          </Button>
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-[var(--border)] lg:pr-4 lg:w-48">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-left",
                activeTab === tab.id
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === "general" && (
              <GeneralSection
                key="general"
                settings={settings.general}
                onChange={(p) => { dispatch(setGeneral(p)); markDirty(); }}
              />
            )}
            {activeTab === "categories" && <CategoriesSection key="categories" />}
            {activeTab === "receipt" && (
              <ReceiptSection
                key="receipt"
                settings={settings.receipt}
                onChange={(p) => { dispatch(setReceipt(p)); markDirty(); }}
                pendingLogoFile={pendingLogoFile}
                onLogoFileSelect={(file) => { setPendingLogoFile(file); markDirty(); }}
              />
            )}
            {activeTab === "payment" && (
              <PaymentSection
                key="payment"
                methods={settings.paymentMethods}
                onToggle={(id, enabled) => { dispatch(setPaymentMethod({ id, enabled })); markDirty(); }}
              />
            )}
            {activeTab === "pos" && (
              <POSSection
                key="pos"
                settings={settings.pos}
                onChange={(p) => { dispatch(setPos(p)); markDirty(); }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageMotion>
  );
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{description}</p>
      </div>
      {children}
    </motion.section>
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
    <SectionShell title="General" description="Business identity and regional settings.">
      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="max-w-md">
            <label className="text-sm font-medium block mb-1.5">Business name</label>
            <Input
              value={settings.businessName}
              onChange={(e) => onChange({ businessName: e.target.value })}
              placeholder="e.g. My Restaurant"
            />
          </div>
          <div className="max-w-md">
            <label className="text-sm font-medium block mb-1.5">Currency symbol</label>
            <Input
              value={settings.currencySymbol}
              onChange={(e) => onChange({ currencySymbol: e.target.value })}
              placeholder="e.g. Rs. or $"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1.5">Used across POS, receipts, and reports (e.g. Rs., $, €).</p>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
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
      /* handled by RTK Query */
    }
  };

  return (
    <SectionShell title="Categories" description="Organize your products into categories.">
      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="text-sm font-medium block mb-1.5">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beverages"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="text-sm font-medium block mb-1.5">Slug (optional)</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Auto from name"
              />
            </div>
            <div className="w-20">
              <label className="text-sm font-medium block mb-1.5">Order</label>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
            <Button type="submit" disabled={!name.trim() || creating} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {creating ? "Adding…" : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg border border-[var(--border)] animate-pulse bg-[var(--muted)]/20" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-10 text-center">
          <FolderOpen className="h-8 w-8 mx-auto text-[var(--muted-foreground)] mb-2" />
          <p className="text-sm font-medium">No categories yet</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Add one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--muted)] text-xs font-bold text-[var(--muted-foreground)]">
                  {i + 1}
                </span>
                <span className="font-medium truncate">{c.name}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">{c.slug}</Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                onClick={() => deleteCategory(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function ReceiptSection({
  settings,
  onChange,
  pendingLogoFile,
  onLogoFileSelect,
}: {
  settings: { logoUrl: string; headerText: string; footerMessage: string; showQrCode: boolean; paperSize: "80mm" | "a4" };
  onChange: (p: Partial<typeof settings>) => void;
  pendingLogoFile: File | null;
  onLogoFileSelect: (file: File | null) => void;
}) {
  const is80 = settings.paperSize === "80mm";
  const fileInputId = "receipt-logo-input";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingLogoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingLogoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingLogoFile]);

  const logoDisplayUrl = previewUrl ?? (settings.logoUrl || null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onLogoFileSelect(file);
    e.target.value = "";
  };

  return (
    <SectionShell title="Receipt Designer" description="Customize how your printed receipts look.">
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="p-5 space-y-5 max-w-md">
            <div>
              <label className="text-sm font-medium block mb-1.5">Logo</label>
              <label
                htmlFor={fileInputId}
                className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/10 text-sm text-[var(--muted-foreground)] overflow-hidden transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/20"
              >
                {logoDisplayUrl ? (
                  <img src={logoDisplayUrl} alt="Logo preview" className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Click to upload logo
                  </span>
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
              <label className="text-sm font-medium block mb-1.5">Header text</label>
              <Input
                value={settings.headerText}
                onChange={(e) => onChange({ headerText: e.target.value })}
                placeholder="e.g. Thank you for your order!"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Footer message</label>
              <Input
                value={settings.footerMessage}
                onChange={(e) => onChange({ footerMessage: e.target.value })}
                placeholder="e.g. Please come again"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Paper size</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={is80 ? "default" : "outline"}
                  size="sm"
                  onClick={() => onChange({ paperSize: "80mm" })}
                >
                  80mm (Thermal)
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
          </CardContent>
        </Card>

        <div className="shrink-0">
          <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2 text-center">Live Preview</p>
          <div className={cn(
            "border border-[var(--border)] rounded-lg bg-white text-black p-5 shadow-sm",
            is80 ? "w-[280px]" : "w-[210px]"
          )}>
            {logoDisplayUrl ? (
              <img src={logoDisplayUrl} alt="Logo" className="h-10 mx-auto mb-3 object-contain" />
            ) : (
              <div className="h-10 mx-auto mb-3 flex items-center justify-center text-gray-300 text-xs border border-dashed border-gray-200 rounded">
                Logo
              </div>
            )}
            <p className="text-center text-sm font-medium mb-3">{settings.headerText || "Header"}</p>
            <div className="text-xs space-y-1.5 border-t border-gray-200 pt-2.5 mt-2">
              <div className="flex justify-between"><span>Item A x 2</span><span>Rs. 10.00</span></div>
              <div className="flex justify-between"><span>Item B x 1</span><span>Rs. 5.00</span></div>
            </div>
            <div className="text-xs font-medium space-y-1 border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between"><span>Total</span><span>Rs. 15.00</span></div>
            </div>
            {settings.showQrCode && (
              <div className="mt-3 w-14 h-14 mx-auto bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400">QR</div>
            )}
            <p className="text-center text-[10px] text-gray-500 mt-3">{settings.footerMessage || "Footer"}</p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
};

function PaymentSection({
  methods,
  onToggle,
}: {
  methods: { id: string; name: string; enabled: boolean }[];
  onToggle: (id: string, enabled: boolean) => void;
}) {
  return (
    <SectionShell title="Payment Methods" description="Enable or disable accepted payment methods.">
      <div className="space-y-2 max-w-lg">
        {methods.map((m) => (
          <SettingRow
            key={m.id}
            label={m.name}
            description={m.enabled ? "Accepted at checkout" : "Disabled"}
            icon={PAYMENT_ICONS[m.id]}
          >
            <Toggle checked={m.enabled} onChange={(val) => onToggle(m.id, val)} />
          </SettingRow>
        ))}
      </div>
    </SectionShell>
  );
}

const ORDER_TYPE_ICONS: Record<string, React.ReactNode> = {
  "dine-in": <UtensilsCrossed className="h-4 w-4" />,
  takeaway: <ShoppingBag className="h-4 w-4" />,
  delivery: <Truck className="h-4 w-4" />,
};

function POSSection({
  settings,
  onChange,
}: {
  settings: POSPreferences;
  onChange: (p: Partial<POSPreferences>) => void;
}) {
  return (
    <SectionShell title="POS Preferences" description="Configure the point-of-sale experience.">
      <div className="space-y-2 max-w-lg">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
          <label className="text-sm font-medium block mb-2">Default order type</label>
          <div className="flex gap-2">
            {(["dine-in", "takeaway", "delivery"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant={settings.defaultOrderType === type ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => onChange({ defaultOrderType: type })}
              >
                {ORDER_TYPE_ICONS[type]}
                {type === "dine-in" ? "Dine-in" : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <SettingRow label="Auto print receipt" description="Print receipt automatically after each order" icon={<Printer className="h-4 w-4" />}>
          <Toggle checked={settings.autoPrintReceipt} onChange={(val) => onChange({ autoPrintReceipt: val })} />
        </SettingRow>
        <SettingRow label="Sound on new order" description="Play a notification sound for incoming orders" icon={<Volume2 className="h-4 w-4" />}>
          <Toggle checked={settings.soundOnNewOrder} onChange={(val) => onChange({ soundOnNewOrder: val })} />
        </SettingRow>
        <SettingRow label="Kitchen auto-accept" description="Automatically move new orders to preparing" icon={<ChefHat className="h-4 w-4" />}>
          <Toggle checked={settings.kitchenAutoAccept} onChange={(val) => onChange({ kitchenAutoAccept: val })} />
        </SettingRow>
      </div>
    </SectionShell>
  );
}
