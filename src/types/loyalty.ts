export type MembershipTier = "bronze" | "silver" | "gold" | "platinum";

export interface LoyaltyTierConfig {
  tier: MembershipTier;
  label: string;
  minPoints: number;
  pointsMultiplier: number;
  color: string;
  perks: string[];
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: "discount" | "free_item" | "percentage";
  value: number;
  active: boolean;
  image?: string;
  expiresAt?: string;
  maxRedemptions?: number;
  timesRedeemed: number;
}

export interface LoyaltyCoupon {
  id: string;
  code: string;
  description: string;
  type: "fixed" | "percent" | "free_item";
  value: number;
  minOrderAmount?: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  validFrom: string;
  validTo: string;
  applicableTo: "all" | "birthday" | "referral" | "tier";
  tierRequired?: MembershipTier;
}

export interface PointsTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: "earned" | "redeemed" | "adjusted" | "expired";
  points: number;
  balance: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerCurrency: number;
  minimumRedeemPoints: number;
  pointsExpiryDays: number;
  birthdayBonusPoints: number;
  referralBonusPoints: number;
  signupBonusPoints: number;
}

export interface LoyaltyState {
  settings: LoyaltySettings;
  rewards: LoyaltyReward[];
  coupons: LoyaltyCoupon[];
  history: PointsTransaction[];
}
