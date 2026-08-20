"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setCredentials, saveAuthToStorage } from "@/redux/api/auth";
import { useLoginMutation } from "@/redux/api/authEndpoints";
import type { UserRole } from "@/types/admin";

type LoginFormValues = { email: string; password: string };

function getRedirectForRole(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "kitchen":
      return "/kitchen";
    default:
      return "/dashboard";
  }
}

export function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await login({ email: data.email, password: data.password }).unwrap();
      const payload = {
        user: {
          ...result.user,
          organizationId: result.user.organizationId,
        },
        token: result.token,
        permissions: result.permissions ?? [],
        subscription: result.subscription || null,
      };
      dispatch(setCredentials(payload));
      saveAuthToStorage(payload);
      const redirect = getRedirectForRole(result.user.role as UserRole);
      router.push(redirect);
    } catch {
      setError("root", { message: "Invalid email or password." });
      toast.error("Invalid email or password.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with your Email and Password.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="email"
            autoComplete="email"
            className="h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Input
            id="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90"
          disabled={isLoading}
        >
          {isLoading ? "Signing in…" : "Login"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-foreground font-medium hover:underline">
          Register your restaurant
        </Link>
      </p>
    </div>
  );
}
