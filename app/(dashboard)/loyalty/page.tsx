"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import {
  updateLoyaltySettings,
  addReward,
  updateReward,
  removeReward,
  addCoupon,
  updateCoupon,
  removeCoupon,
} from "@/redux/slices/loyaltySlice";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LoyaltyReward, LoyaltyCoupon, MembershipTier, LoyaltyTierConfig } from "@/types/loyalty";
import {
  Gift,
  Star,
  Ticket,
  Crown,
  Trophy,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Tag,
  Settings2,
  History,
  Percent,
  DollarSign,
  Coffee,
  Cake,
  UserPlus,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type Tab = "rewards" | "coupons" | "tiers" | "settings" | "history";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "rewards", label: "Rewards", icon: <Gift className="h-4 w-4" /> },
  { id: "coupons", label: "Coupons", icon: <Ticket className="h-4 w-4" /> },
  { id: "tiers", label: "Tiers", icon: <Crown className="h-4 w-4" /> },
  { id: "history", label: "History", icon: <History className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings2 className="h-4 w-4" /> },
];

const TIER_CONFIGS: LoyaltyTierConfig[] = [
  { tier: "bronze", label: "Bronze", minPoints: 0, pointsMultiplier: 1, color: "from-amber-700 to-amber-600", perks: ["Earn 1x points", "Basic rewards access"] },
  { tier: "silver", label: "Silver", minPoints: 500, pointsMultiplier: 1.5, color: "from-slate-400 to-slate-500", perks: ["Earn 1.5x points", "Birthday bonus", "Priority queue"] },
  { tier: "gold", label: "Gold", minPoints: 2000, pointsMultiplier: 2, color: "from-yellow-500 to-amber-500", perks: ["Earn 2x points", "Birthday bonus", "Free delivery", "Exclusive rewards"] },
  { tier: "platinum", label: "Platinum", minPoints: 5000, pointsMultiplier: 3, color: "from-purple-500 to-indigo-600", perks: ["Earn 3x points", "All Gold perks", "VIP events", "Personal offers"] },
];

const REWARD_TYPE_ICON: Record<string, React.ReactNode> = {
  discount: <DollarSign className="h-4 w-4" />,
  percentage: <Percent className="h-4 w-4" />,
  free_item: <Coffee className="h-4 w-4" />,
};

const COUPON_TYPE_ICON: Record<string, React.ReactNode> = {
  birthday: <Cake className="h-4 w-4 text-pink-500" />,
  referral: <UserPlus className="h-4 w-4 text-blue-500" />,
  all: <Users className="h-4 w-4 text-slate-500" />,
  tier: <Crown className="h-4 w-4 text-purple-500" />,
};

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
        checked ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  );
}

function RewardCard({ reward, onToggle, onDelete }: { reward: LoyaltyReward; onToggle: () => void; onDelete: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md",
        !reward.active && "opacity-60"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              {REWARD_TYPE_ICON[reward.type] ?? <Gift className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold">{reward.name}</h4>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{reward.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <ToggleSwitch checked={reward.active} onChange={onToggle} />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
          <Badge variant="secondary" className="text-xs gap-1">
            <Star className="h-3 w-3" />
            {reward.pointsCost} pts
          </Badge>
          <span className="text-xs text-[var(--muted-foreground)]">
            Redeemed {reward.timesRedeemed} time{reward.timesRedeemed !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CouponCard({ coupon, onToggle, onDelete }: { coupon: LoyaltyCoupon; onToggle: () => void; onDelete: () => void }) {
  const now = new Date();
  const isExpired = new Date(coupon.validTo) < now;
  const isExhausted = coupon.usedCount >= coupon.maxUses;
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md",
        (!coupon.active || isExpired || isExhausted) && "opacity-60"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              {COUPON_TYPE_ICON[coupon.applicableTo] ?? <Tag className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <code className="text-sm font-bold tracking-wider bg-[var(--muted)] px-2 py-0.5 rounded">{coupon.code}</code>
                {isExpired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
                {isExhausted && !isExpired && <Badge variant="secondary" className="text-[10px]">Used up</Badge>}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{coupon.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <ToggleSwitch checked={coupon.active} onChange={onToggle} />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
          <Badge variant="secondary" className="text-xs">
            {coupon.type === "percent" ? `${coupon.value}% off` : coupon.type === "fixed" ? `Rs. ${coupon.value} off` : "Free item"}
          </Badge>
          <span className="text-xs text-[var(--muted-foreground)]">
            {coupon.usedCount}/{coupon.maxUses} used
          </span>
          <span className="text-xs text-[var(--muted-foreground)] ml-auto capitalize">
            {coupon.applicableTo}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function TierCard({ config }: { config: LoyaltyTierConfig }) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)] transition-shadow hover:shadow-md">
      <div className={cn("bg-gradient-to-r px-5 py-4 text-white", config.color)}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold">{config.label}</h4>
            <p className="text-sm text-white/80">{config.minPoints}+ points</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Trophy className="h-5 w-5" />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
          {config.pointsMultiplier}x points multiplier
        </div>
        <ul className="space-y-1.5">
          {config.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function LoyaltyPage() {
  const dispatch = useAppDispatch();
  const { settings, rewards, coupons, history } = useAppSelector((s) => s.loyalty);
  const [tab, setTab] = useState<Tab>("rewards");

  const stats = useMemo(() => ({
    totalRewards: rewards.length,
    activeRewards: rewards.filter((r) => r.active).length,
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter((c) => c.active).length,
    totalRedeemed: rewards.reduce((s, r) => s + r.timesRedeemed, 0) + coupons.reduce((s, c) => s + c.usedCount, 0),
    totalTransactions: history.length,
  }), [rewards, coupons, history]);

  const handleAddReward = () => {
    const id = `rw-${Date.now()}`;
    dispatch(addReward({
      id,
      name: "New Reward",
      description: "Describe this reward",
      pointsCost: 100,
      type: "discount",
      value: 50,
      active: true,
      timesRedeemed: 0,
    }));
    toast.success("Reward added — edit details inline");
  };

  const handleAddCoupon = () => {
    const id = `cp-${Date.now()}`;
    const now = new Date();
    const future = new Date(now);
    future.setMonth(future.getMonth() + 3);
    dispatch(addCoupon({
      id,
      code: `CODE${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      description: "New coupon",
      type: "percent",
      value: 10,
      maxUses: 100,
      usedCount: 0,
      active: true,
      validFrom: now.toISOString().split("T")[0],
      validTo: future.toISOString().split("T")[0],
      applicableTo: "all",
    }));
    toast.success("Coupon added");
  };

  return (
    <RoleGuard permission="loyalty">
      <PageMotion>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Loyalty Program</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage rewards, coupons, membership tiers, and point settings
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Badge className={cn("text-xs gap-1.5", settings.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
              {settings.enabled ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
              {settings.enabled ? "Active" : "Disabled"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Active Rewards" value={stats.activeRewards} animate icon={<Gift className="h-5 w-5" />} subtitle={`${stats.totalRewards} total`} />
          <StatsCard title="Active Coupons" value={stats.activeCoupons} animate icon={<Ticket className="h-5 w-5" />} subtitle={`${stats.totalCoupons} total`} />
          <StatsCard title="Total Redeemed" value={stats.totalRedeemed} animate icon={<Star className="h-5 w-5" />} />
          <StatsCard title="Transactions" value={stats.totalTransactions} animate icon={<History className="h-5 w-5" />} />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <nav className="flex items-center gap-1 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all shrink-0",
                      tab === t.id
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {tab === "rewards" && (
                  <motion.div key="rewards" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--muted-foreground)]">{rewards.length} reward{rewards.length !== 1 ? "s" : ""}</p>
                      <Button size="sm" onClick={handleAddReward} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Add Reward
                      </Button>
                    </div>
                    {rewards.length === 0 ? (
                      <EmptyState title="No rewards" description="Create rewards that customers can redeem with their loyalty points." icon={<Gift className="h-6 w-6" />} />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                          {rewards.map((r) => (
                            <RewardCard
                              key={r.id}
                              reward={r}
                              onToggle={() => dispatch(updateReward({ id: r.id, data: { active: !r.active } }))}
                              onDelete={() => { dispatch(removeReward(r.id)); toast.success("Reward removed"); }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}

                {tab === "coupons" && (
                  <motion.div key="coupons" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--muted-foreground)]">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""}</p>
                      <Button size="sm" onClick={handleAddCoupon} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Add Coupon
                      </Button>
                    </div>
                    {coupons.length === 0 ? (
                      <EmptyState title="No coupons" description="Create coupon codes for special promotions." icon={<Ticket className="h-6 w-6" />} />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                          {coupons.map((c) => (
                            <CouponCard
                              key={c.id}
                              coupon={c}
                              onToggle={() => dispatch(updateCoupon({ id: c.id, data: { active: !c.active } }))}
                              onDelete={() => { dispatch(removeCoupon(c.id)); toast.success("Coupon removed"); }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}

                {tab === "tiers" && (
                  <motion.div key="tiers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <p className="text-sm text-[var(--muted-foreground)]">Membership tiers reward your most loyal customers with escalating perks.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {TIER_CONFIGS.map((t) => (
                        <TierCard key={t.tier} config={t} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {tab === "history" && (
                  <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    {history.length === 0 ? (
                      <EmptyState title="No transactions yet" description="Points earned and redeemed will appear here." icon={<History className="h-6 w-6" />} />
                    ) : (
                      <div className="space-y-2">
                        {history.slice(0, 50).map((tx) => {
                          const isPositive = tx.type === "earned";
                          return (
                            <div key={tx.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{tx.customerName}</span>
                                  <Badge variant="secondary" className="text-[10px] capitalize">{tx.type}</Badge>
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{tx.description}</p>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <span className={cn("text-sm font-bold tabular-nums", isPositive ? "text-emerald-600" : "text-red-500")}>
                                  {isPositive ? "+" : "-"}{Math.abs(tx.points)}
                                </span>
                                <p className="text-[10px] text-[var(--muted-foreground)]">
                                  {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {tab === "settings" && (
                  <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <SettingRow label="Loyalty Program" description="Enable or disable the loyalty points system">
                      <ToggleSwitch checked={settings.enabled} onChange={(v) => dispatch(updateLoyaltySettings({ enabled: v }))} />
                    </SettingRow>
                    <SettingRow label="Points per Rs. 1" description="How many points earned per currency unit spent">
                      <input
                        type="number"
                        min={0}
                        value={settings.pointsPerCurrency}
                        onChange={(e) => dispatch(updateLoyaltySettings({ pointsPerCurrency: Number(e.target.value) || 0 }))}
                        className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </SettingRow>
                    <SettingRow label="Minimum Redeem" description="Minimum points required to redeem">
                      <input
                        type="number"
                        min={0}
                        value={settings.minimumRedeemPoints}
                        onChange={(e) => dispatch(updateLoyaltySettings({ minimumRedeemPoints: Number(e.target.value) || 0 }))}
                        className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </SettingRow>
                    <SettingRow label="Points Expiry (days)" description="Points expire after this many days">
                      <input
                        type="number"
                        min={0}
                        value={settings.pointsExpiryDays}
                        onChange={(e) => dispatch(updateLoyaltySettings({ pointsExpiryDays: Number(e.target.value) || 0 }))}
                        className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </SettingRow>
                    <SettingRow label="Birthday Bonus" description="Bonus points on customer's birthday">
                      <input
                        type="number"
                        min={0}
                        value={settings.birthdayBonusPoints}
                        onChange={(e) => dispatch(updateLoyaltySettings({ birthdayBonusPoints: Number(e.target.value) || 0 }))}
                        className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </SettingRow>
                    <SettingRow label="Referral Bonus" description="Points awarded for each successful referral">
                      <input
                        type="number"
                        min={0}
                        value={settings.referralBonusPoints}
                        onChange={(e) => dispatch(updateLoyaltySettings({ referralBonusPoints: Number(e.target.value) || 0 }))}
                        className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </SettingRow>
                    <SettingRow label="Signup Bonus" description="Points awarded to new customers on registration">
                      <input
                        type="number"
                        min={0}
                        value={settings.signupBonusPoints}
                        onChange={(e) => dispatch(updateLoyaltySettings({ signupBonusPoints: Number(e.target.value) || 0 }))}
                        className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </SettingRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </PageMotion>
    </RoleGuard>
  );
}
