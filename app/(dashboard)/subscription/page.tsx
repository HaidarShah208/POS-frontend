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
    const planFeatures = (selectedPlan.features as Record<string, unknown>)?.list as string[] ?? DEFAULT_FEATURES[selectedPlan.slug] ?? [];

    return (
      <RoleGuard permission="settings">
        <PageMotion>
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => { setStep("plans"); setErrors({}); }}
              className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Back to Plans
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Payment Details</h2>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">Complete your payment to activate your plan</p>
                </div>

                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-3">Payment Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => { setPaymentMethod(pm.id); setErrors({ ...errors, method: "" }); }}
                          className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === pm.id
                              ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
                              : "border-[var(--border)] hover:border-[var(--primary)]/30"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              pm.id === "EASYPAISA" ? "bg-green-100 text-green-600" :
                              pm.id === "JAZZCASH" ? "bg-red-100 text-red-600" :
                              "bg-blue-100 text-blue-600"
                            }`}>
                              {pm.icon}
                            </div>
                            <span className="font-medium text-xs sm:text-sm">{pm.name}</span>
                            <span className="text-[9px] sm:text-[10px] text-[var(--muted-foreground)] leading-tight">{pm.details}</span>
                          </div>
                          {paymentMethod === pm.id && (
                            <CheckCircle2 className="absolute top-1.5 right-1.5 h-4 w-4 text-[var(--primary)]" />
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.method && <p className="text-xs text-red-500 mt-2">{errors.method}</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 space-y-4">
                    <h3 className="text-sm font-semibold">Payment Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Account Holder Name</label>
                        <Input
                          value={accountTitle}
                          onChange={(e) => { setAccountTitle(e.target.value); setErrors({ ...errors, accountTitle: "" }); }}
                          placeholder="Muhammad Ali"
                          className="mt-1.5"
                        />
                        {errors.accountTitle && <p className="text-xs text-red-500 mt-1">{errors.accountTitle}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Transaction ID / Reference</label>
                        <Input
                          value={transactionId}
                          onChange={(e) => { setTransactionId(e.target.value); setErrors({ ...errors, transactionId: "" }); }}
                          placeholder="TXN123456789"
                          className="mt-1.5"
                        />
                        {errors.transactionId && <p className="text-xs text-red-500 mt-1">{errors.transactionId}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Payment Receipt</label>
                      <div className="mt-1.5">
                        {receiptPreview ? (
                          <div className="relative rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--muted)]/20">
                            <img src={receiptPreview} alt="Receipt" className="w-full max-h-40 object-contain" />
                            <button
                              onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-red-500 hover:bg-white shadow-sm"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/40 cursor-pointer transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center shrink-0">
                              <Upload className="h-5 w-5 text-[var(--muted-foreground)]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Upload receipt screenshot</p>
                              <p className="text-[10px] text-[var(--muted-foreground)]">JPEG, PNG, GIF, WebP · Max 5MB</p>
                            </div>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                          </label>
                        )}
                      </div>
                      {errors.receipt && <p className="text-xs text-red-500 mt-1">{errors.receipt}</p>}
                    </div>
                  </CardContent>
                </Card>

                {errors.submit && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {errors.submit}
                  </div>
                )}

                <Button onClick={handleSubmitPayment} disabled={submitting} className="w-full gap-2 h-12 text-base rounded-xl">
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                  {submitting ? "Processing..." : `Submit Payment — ${formatCurrency(Number(selectedPlan.price))}`}
                </Button>
              </div>

              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-6 space-y-4">
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="text-sm font-semibold mb-4">Order Summary</h3>
                      <div className={`rounded-xl bg-gradient-to-br ${PLAN_COLORS[selectedPlan.slug] ?? PLAN_COLORS.starter} p-4 text-white mb-4`}>
                        <div className="flex items-center gap-2 mb-2">
                          {PLAN_ICONS[selectedPlan.slug] ?? <Zap className="h-5 w-5" />}
                          <span className="font-bold">{selectedPlan.name}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold tabular-nums">{formatCurrency(Number(selectedPlan.price))}</span>
                          <span className="text-sm opacity-80">/month</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {planFeatures.map((f, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-[var(--muted-foreground)]">{typeof f === "string" ? f : String(f)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-[var(--border)] pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--muted-foreground)]">Plan</span>
                          <span className="font-medium">{selectedPlan.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--muted-foreground)]">Duration</span>
                          <span className="font-medium">1 Month</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-2 border-t border-[var(--border)]">
                          <span>Total</span>
                          <span>{formatCurrency(Number(selectedPlan.price))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                        <Shield className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                        <p>Your payment will be manually verified by our team. Once approved, your plan will be activated within 24 hours.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
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
