import { createSlice } from "@reduxjs/toolkit";
import type { SettingsState } from "@/types/settings";

const STORAGE_KEY = "pos-settings";
const MAX_LOGO_LENGTH = 100_000;

function loadStored(): Partial<SettingsState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SettingsState>) : null;
  } catch {
    return null;
  }
}

const defaults: SettingsState = {
  general: {
    businessName: "Restaurant POS",
    currencySymbol: "Rs.",
  },
  tax: {
    taxName: "VAT",
    taxPercentage: 8,
    serviceCharge: 10,
    taxEnabled: true,
    serviceChargeEnabled: false,
  },
  receipt: {
    logoUrl: "",
    headerText: "Thank you for your order!",
    footerMessage: "Please come again.",
    showQrCode: false,
    paperSize: "80mm",
  },
  paymentMethods: [
    { id: "cash", name: "Cash", enabled: true },
    { id: "card", name: "Card", enabled: true },
    { id: "mobile", name: "Mobile", enabled: true },
 
  ],
  pos: {
    defaultOrderType: "dine-in",
    autoPrintReceipt: false,
    soundOnNewOrder: true,
    kitchenAutoAccept: false,
  },
};

const stored = loadStored();
const initialState: SettingsState = {
  general: { ...defaults.general, ...stored?.general },
  tax: { ...defaults.tax, ...stored?.tax },
  receipt: { ...defaults.receipt, ...stored?.receipt },
  paymentMethods: stored?.paymentMethods?.length ? stored.paymentMethods : defaults.paymentMethods,
  pos: { ...defaults.pos, ...stored?.pos },
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTax: (state, action: { payload: Partial<SettingsState["tax"]> }) => {
      state.tax = { ...state.tax, ...action.payload };
    },
    setReceipt: (state, action: { payload: Partial<SettingsState["receipt"]> }) => {
      state.receipt = { ...state.receipt, ...action.payload };
    },
    setPaymentMethod: (state, action: { payload: { id: string; enabled: boolean } }) => {
      const item = state.paymentMethods.find((m) => m.id === action.payload.id);
      if (item) item.enabled = action.payload.enabled;
    },
    addPaymentMethod: (state, action: { payload: { id: string; name: string } }) => {
      state.paymentMethods.push({ id: action.payload.id, name: action.payload.name, enabled: true });
    },
    setPos: (state, action: { payload: Partial<SettingsState["pos"]> }) => {
      state.pos = { ...state.pos, ...action.payload };
    },
    setGeneral: (state, action: { payload: Partial<SettingsState["general"]> }) => {
      state.general = { ...state.general, ...action.payload };
    },
    saveSettings: (state) => {
      if (typeof window === "undefined") return;
      try {
        // Clone and trim large fields (e.g. base64 logo) before persisting.
        const toPersist: SettingsState = JSON.parse(JSON.stringify(state)) as SettingsState;
        if (toPersist.receipt.logoUrl && toPersist.receipt.logoUrl.length > MAX_LOGO_LENGTH) {
          toPersist.receipt.logoUrl = toPersist.receipt.logoUrl.slice(0, MAX_LOGO_LENGTH);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
      } catch (e) {
        // Swallow quota/serialization errors so the app doesn't crash.
        // eslint-disable-next-line no-console
        console.warn("[settings] Failed to save settings to localStorage:", e);
      }
    },
  },
});

export const { setTax, setReceipt, setPaymentMethod, addPaymentMethod, setPos, setGeneral, saveSettings } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
