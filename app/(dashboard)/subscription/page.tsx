"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageMotion } from "@/components/shared/PageMotion";
import { PageHeader } from "@/components/admin/PageHeader";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose,
} from "@/components/ui/modal";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setSubscription, saveAuthToStorage } from "@/redux/api/auth/authSlice";
import {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useGetPaymentStatusQuery,
  useSubmitPaymentMutation,
} from "@/redux/api/subscriptionEndpoints";
import { formatCurrency } from "@/lib/utils";
import {
  Crown, Check, Zap, Shield, Rocket, Upload,
  CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Smartphone, Building2, Banknote,
} from "lucide-react";

type FlowStep = "plans" | "payment" | "pending";
type PaymentMethodType = "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="h-6 w-6" />,
  professional: <Shield className="h-6 w-6" />,
  enterprise: <Rocket className="h-6 w-6" />,
  free_trial: <Crown className="h-6 w-6" />,
};

const PLAN_COLORS: Record<string, string> = {
  starter: "from-blue-500 to-blue-600",
  professional: "from-violet-500 to-purple-600",
  enterprise: "from-amber-500 to-orange-600",
  free_trial: "from-slate-400 to-slate-500",
};

const PAYMENT_METHODS: { id: PaymentMethodType; name: string; icon: React.ReactNode; color: string; details: string }[] = [
  { id: "EASYPAISA", name: "EasyPaisa", icon: <Smartphone className="h-6 w-6" />, color: "bg-green-50 border-green-200 hover:border-green-400", details: "Account: 03XX-XXXXXXX" },
  { id: "JAZZCASH", name: "JazzCash", icon: <Smartphone className="h-6 w-6" />, color: "bg-red-50 border-red-200 hover:border-red-400", details: "Account: 03XX-XXXXXXX" },
  { id: "BANK_TRANSFER", name: "Bank Transfer", icon: <Building2 className="h-6 w-6" />, color: "bg-blue-50 border-blue-200 hover:border-blue-400", details: "Bank: HBL | Account: XXXX-XXXXXXXX" },
];

const DEFAULT_FEATURES: Record<string, string[]> = {
  starter: ["Up to 1 branch", "Up to 5 staff members", "Basic POS features", "Email support"],
  professional: ["Up to 3 branches", "Up to 15 staff members", "Full POS + Kitchen Display", "Inventory management", "Priority support"],
  enterprise: ["Unlimited branches", "Unlimited staff", "All features included", "Advanced analytics", "24/7 dedicated support"],
  free_trial: ["14-day free trial", "All features included", "No credit card required"],
};

export default function SubscriptionPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);

  const { data: plans = [], isLoading: plansLoading } = useGetPlansQuery();
  const { data: mySub } = useGetMySubscriptionQuery();
  const { data: paymentStatus } = useGetPaymentStatusQuery();
  const [submitPayment, { isLoading: submitting }] = useSubmitPaymentMutation();

  const isAlreadyPending = paymentStatus?.status === "PENDING";
  const isActive = mySub?.status === "active";

  const initialStep: FlowStep = isAlreadyPending ? "pending" : isActive ? "plans" : "plans";
  const [step, setStep] = useState<FlowStep>(initialStep);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [accountTitle, setAccountTitle] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSelectPlan = (planId: string) => {
    if (isActive) return;
    setSelectedPlanId(planId);
    setStep("payment");
    setPaymentMethod(null);
    setAccountTitle("");
    setTransactionId("");
    setReceiptFile(null);
    setReceiptPreview(null);
    setErrors({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, receipt: "File size must be less than 5MB" });
      return;
    }
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
      setErrors({ ...errors, receipt: "Only JPEG, PNG, GIF, or WebP images are allowed" });
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setErrors({ ...errors, receipt: "" });
  };

  const validatePayment = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!paymentMethod) newErrors.method = "Please select a payment method";
    if (!accountTitle.trim()) newErrors.accountTitle = "Account holder name is required";
    if (!transactionId.trim()) newErrors.transactionId = "Transaction ID / Reference is required";
    if (!receiptFile) newErrors.receipt = "Please upload payment receipt screenshot";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitPayment = async () => {
    if (!validatePayment() || !selectedPlan || !paymentMethod) return;

    const formData = new FormData();
    formData.append("planId", selectedPlan.id);
    formData.append("amount", String(selectedPlan.price));
    formData.append("paymentMethod", paymentMethod);
    formData.append("accountTitle", accountTitle.trim());
    formData.append("transactionId", transactionId.trim());
    if (receiptFile) formData.append("receipt", receiptFile);

    try {
      await submitPayment(formData).unwrap();
      dispatch(setSubscription({ status: "pending_verification", planSlug: selectedPlan.slug, trialEndsAt: mySub?.trialEndsAt ?? null }));
      saveAuthToStorage({
        user: auth.user!,
        token: auth.token!,
        permissions: auth.permissions,
        subscription: { status: "pending_verification", planSlug: selectedPlan.slug, trialEndsAt: mySub?.trialEndsAt ?? null },
      });
      setStep("pending");
    } catch {
      setErrors({ submit: "Failed to submit payment. Please try again." });
    }
  };

  if (isAlreadyPending || step === "pending") {
    return (
      <RoleGuard permission="settings">
        <PageMotion>
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full text-center space-y-6"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">Payment Under Review</h2>
                <p className="text-[var(--muted-foreground)] mt-2 text-sm leading-relaxed">
                  Your payment has been submitted successfully. Our team will verify your payment and activate your subscription within 24 hours.
                </p>
              </div>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Status</span>
                    <Badge variant="warning">Pending Verification</Badge>
                  </div>
                  {paymentStatus && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Method</span>
                        <span className="font-medium">{paymentStatus.paymentMethod}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Amount</span>
                        <span className="font-medium">{formatCurrency(Number(paymentStatus.amount))}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Submitted</span>
                        <span className="font-medium">{new Date(paymentStatus.createdAt).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Button variant="outline" onClick={() => router.push("/dashboard")} className="gap-2">
                Back to Dashboard
              </Button>
            </motion.div>
          </div>
        </PageMotion>
      </RoleGuard>
    );
  }

  if (step === "payment" && selectedPlan) {
    return (
      <RoleGuard permission="settings">
        <PageMotion>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => { setStep("plans"); setErrors({}); }}>
                ← Back to Plans
              </Button>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Complete Payment</h2>
              <p className="text-[var(--muted-foreground)]">
                {selectedPlan.name} — {formatCurrency(Number(selectedPlan.price))}/month
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Select Payment Method</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => { setPaymentMethod(pm.id); setErrors({ ...errors, method: "" }); }}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === pm.id
                            ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20"
                            : pm.color
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          {pm.icon}
                          <span className="font-medium text-sm">{pm.name}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">{pm.details}</span>
                        </div>
                        {paymentMethod === pm.id && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.method && <p className="text-xs text-red-500 mt-1">{errors.method}</p>}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Account Holder Name</label>
                    <Input
                      value={accountTitle}
                      onChange={(e) => { setAccountTitle(e.target.value); setErrors({ ...errors, accountTitle: "" }); }}
                      placeholder="e.g. Muhammad Ali"
                      className="mt-1"
                    />
                    {errors.accountTitle && <p className="text-xs text-red-500 mt-1">{errors.accountTitle}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Transaction ID / Reference Number</label>
                    <Input
                      value={transactionId}
                      onChange={(e) => { setTransactionId(e.target.value); setErrors({ ...errors, transactionId: "" }); }}
                      placeholder="e.g. TXN123456789"
                      className="mt-1"
                    />
                    {errors.transactionId && <p className="text-xs text-red-500 mt-1">{errors.transactionId}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Receipt Screenshot</label>
                    <div className="mt-1">
                      {receiptPreview ? (
                        <div className="relative rounded-xl border border-[var(--border)] overflow-hidden">
                          <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain bg-[var(--muted)]/30" />
                          <button
                            onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/50 cursor-pointer transition-colors bg-[var(--muted)]/10">
                          <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
                          <span className="text-sm text-[var(--muted-foreground)]">Click to upload receipt</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">JPEG, PNG, GIF, WebP · Max 5MB</span>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      )}
                    </div>
                    {errors.receipt && <p className="text-xs text-red-500 mt-1">{errors.receipt}</p>}
                  </div>
                </div>

                {errors.submit && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {errors.submit}
                  </div>
                )}

                <Button onClick={handleSubmitPayment} disabled={submitting} className="w-full gap-2 h-12 text-base">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {submitting ? "Submitting..." : `Pay ${formatCurrency(Number(selectedPlan.price))}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageMotion>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard permission="settings">
      <PageMotion>
        <PageHeader title="Subscription Plans" description="Choose the best plan for your restaurant" />

        {isActive && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm mb-4">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Your subscription is active</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Plan: {mySub?.plan?.name ?? "—"} · Since {mySub?.startsAt ? new Date(mySub.startsAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        )}

        {plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl animate-pulse bg-[var(--muted)]/30 border border-[var(--border)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans
              .filter((p) => p.slug !== "free_trial" && p.active)
              .map((plan, idx) => {
                const features = (plan.features as Record<string, unknown>)?.list as string[] ?? DEFAULT_FEATURES[plan.slug] ?? [];
                const isPopular = plan.slug === "professional";
                const isCurrent = mySub?.planId === plan.id && isActive;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={`relative overflow-hidden h-full flex flex-col ${
                      isPopular ? "border-[var(--primary)] shadow-lg" : ""
                    }`}>
                      {isPopular && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                          Popular
                        </div>
                      )}
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${PLAN_COLORS[plan.slug] ?? PLAN_COLORS.starter} flex items-center justify-center text-white mb-4`}>
                          {PLAN_ICONS[plan.slug] ?? <Zap className="h-6 w-6" />}
                        </div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-bold tabular-nums">{formatCurrency(Number(plan.price))}</span>
                          <span className="text-sm text-[var(--muted-foreground)]">/month</span>
                        </div>
                        <div className="flex-1 mt-6 space-y-3">
                          {features.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{typeof f === "string" ? f : String(f)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6">
                          {isCurrent ? (
                            <Button variant="outline" disabled className="w-full">Current Plan</Button>
                          ) : (
                            <Button
                              onClick={() => handleSelectPlan(plan.id)}
                              variant={isPopular ? "default" : "outline"}
                              className="w-full"
                              disabled={isActive}
                            >
                              {isActive ? "Active" : "Choose Plan"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        )}
      </PageMotion>
    </RoleGuard>
  );
}
