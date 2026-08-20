"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRegisterOrganizationMutation } from "@/redux/api/authEndpoints";
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials, saveAuthToStorage } from "@/redux/api/auth/authSlice";
import loginImg from "@/assets/login.png";
import {
  Store,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const FEATURES = [
  "Complete POS system ready in seconds",
  "Manage orders, inventory & kitchen",
  "Multi-branch support from day one",
  "Real-time analytics & reports",
  "14-day free trial, no credit card",
];

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerOrg, { isLoading }] = useRegisterOrganizationMutation();

  const [form, setForm] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.restaurantName || !form.ownerName || !form.email || !form.password) {
      setError("Please fill in all required fields");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const result = await registerOrg(form).unwrap();
      const authPayload = {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role as "owner",
          branchId: result.user.branchId,
          organizationId: result.user.organizationId,
        },
        token: result.token,
        permissions: result.permissions ?? [],
        subscription: result.subscription || null,
      };
      dispatch(setCredentials(authPayload));
      saveAuthToStorage(authPayload);
      router.push("/dashboard");
    } catch (err) {
      const apiError = err as { data?: { error?: string } };
      setError(apiError?.data?.error || "Registration failed. Please try again.");
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 4);
  })();

  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden lg:flex lg:w-[45%] xl:w-[50%] flex-col">
        <Image
          src={loginImg}
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="relative z-10 flex flex-col justify-end h-full p-10 xl:p-14">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/90 text-sm font-medium">Free 14-day trial</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Launch your restaurant&apos;s digital future
            </h2>
            <p className="text-white/70 text-base xl:text-lg leading-relaxed mb-8">
              Join hundreds of restaurants using our all-in-one POS platform to streamline operations and boost revenue.
            </p>

            <div className="space-y-3">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-white/85 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-8 sm:px-12 lg:w-[55%] xl:w-[50%] lg:px-16 xl:px-24 bg-[var(--background)]">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--primary)] transition-transform group-hover:scale-105">
                <Store className="w-5 h-5 text-[var(--primary-foreground)]" />
              </div>
              <span className="text-lg font-bold text-[var(--foreground)]">Restaurant POS</span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
              Create your account
            </h1>
            <p className="text-[var(--muted-foreground)] mt-2">
              Get started with a free 14-day trial. No credit card needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Restaurant Name <span className="text-[var(--destructive)]">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    value={form.restaurantName}
                    onChange={(e) => updateField("restaurantName", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                    placeholder="My Restaurant"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Your Name <span className="text-[var(--destructive)]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Email Address <span className="text-[var(--destructive)]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                  placeholder="you@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Password <span className="text-[var(--destructive)]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-[var(--border)]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {strengthLabels[passwordStrength - 1] ?? "Too short"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Phone Number <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm hover:shadow-md active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating your restaurant...
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[var(--muted-foreground)] leading-relaxed">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--background)] px-3 text-[var(--muted-foreground)]">Already have an account?</span>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Sign in to your account
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
