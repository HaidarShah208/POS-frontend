import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  LoyaltyState,
  LoyaltySettings,
  LoyaltyReward,
  LoyaltyCoupon,
  PointsTransaction,
} from "@/types/loyalty";
import { loadFromStorage, saveToStorage } from "@/lib/localStorage";

const KEY = "pos-loyalty";

const DEFAULT_SETTINGS: LoyaltySettings = {
  enabled: true,
  pointsPerCurrency: 1,
  minimumRedeemPoints: 100,
  pointsExpiryDays: 365,
  birthdayBonusPoints: 50,
  referralBonusPoints: 100,
  signupBonusPoints: 25,
};

const DEFAULT_REWARDS: LoyaltyReward[] = [
  {
    id: "rw-1",
    name: "10% Off Next Order",
    description: "Get 10% discount on your next order",
    pointsCost: 200,
    type: "percentage",
    value: 10,
    active: true,
    timesRedeemed: 0,
  },
  {
    id: "rw-2",
    name: "Free Drink",
    description: "Redeem a free soft drink or juice",
    pointsCost: 150,
    type: "free_item",
    value: 0,
    active: true,
    timesRedeemed: 0,
  },
  {
    id: "rw-3",
    name: "Rs. 200 Off",
    description: "Flat Rs. 200 off on orders above Rs. 1000",
    pointsCost: 500,
    type: "discount",
    value: 200,
    active: true,
    timesRedeemed: 0,
  },
];

const DEFAULT_COUPONS: LoyaltyCoupon[] = [
  {
    id: "cp-1",
    code: "WELCOME25",
    description: "25% off for new customers",
    type: "percent",
    value: 25,
    minOrderAmount: 500,
    maxUses: 100,
    usedCount: 12,
    active: true,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    applicableTo: "all",
  },
  {
    id: "cp-2",
    code: "BIRTHDAY50",
    description: "Rs. 50 off on your birthday",
    type: "fixed",
    value: 50,
    maxUses: 500,
    usedCount: 34,
    active: true,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    applicableTo: "birthday",
  },
  {
    id: "cp-3",
    code: "REFER100",
    description: "Rs. 100 off when referred by a friend",
    type: "fixed",
    value: 100,
    minOrderAmount: 800,
    maxUses: 200,
    usedCount: 8,
    active: true,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    applicableTo: "referral",
  },
];

const DEFAULT_HISTORY: PointsTransaction[] = [];

const FALLBACK: LoyaltyState = { settings: DEFAULT_SETTINGS, rewards: DEFAULT_REWARDS, coupons: DEFAULT_COUPONS, history: DEFAULT_HISTORY };

function persist(state: LoyaltyState) { saveToStorage(KEY, state); }

const loyaltySlice = createSlice({
  name: "loyalty",
  initialState: loadFromStorage(KEY, FALLBACK),
  reducers: {
    updateLoyaltySettings(state, action: PayloadAction<Partial<LoyaltySettings>>) {
      Object.assign(state.settings, action.payload);
      persist(state);
    },
    addReward(state, action: PayloadAction<LoyaltyReward>) {
      state.rewards.push(action.payload);
      persist(state);
    },
    updateReward(state, action: PayloadAction<{ id: string; data: Partial<LoyaltyReward> }>) {
      const idx = state.rewards.findIndex((r) => r.id === action.payload.id);
      if (idx >= 0) Object.assign(state.rewards[idx], action.payload.data);
      persist(state);
    },
    removeReward(state, action: PayloadAction<string>) {
      state.rewards = state.rewards.filter((r) => r.id !== action.payload);
      persist(state);
    },
    addCoupon(state, action: PayloadAction<LoyaltyCoupon>) {
      state.coupons.push(action.payload);
      persist(state);
    },
    updateCoupon(state, action: PayloadAction<{ id: string; data: Partial<LoyaltyCoupon> }>) {
      const idx = state.coupons.findIndex((c) => c.id === action.payload.id);
      if (idx >= 0) Object.assign(state.coupons[idx], action.payload.data);
      persist(state);
    },
    removeCoupon(state, action: PayloadAction<string>) {
      state.coupons = state.coupons.filter((c) => c.id !== action.payload);
      persist(state);
    },
    addPointsTransaction(state, action: PayloadAction<PointsTransaction>) {
      state.history.unshift(action.payload);
      if (state.history.length > 200) state.history = state.history.slice(0, 200);
      persist(state);
    },
  },
});

export const {
  updateLoyaltySettings,
  addReward,
  updateReward,
  removeReward,
  addCoupon,
  updateCoupon,
  removeCoupon,
  addPointsTransaction,
} = loyaltySlice.actions;

export const loyaltyReducer = loyaltySlice.reducer;
