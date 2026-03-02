"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setCredentials, saveAuthToStorage } from "@/redux/api/auth";
import { useLoginMutation } from "@/redux/api/authEndpoints";
import loginImg from '../../assets/login.jpeg'


type LoginFormValues = { email: string; password: string };

export function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await login({ email: data.email, password: data.password }).unwrap();
      const payload = { user: result.user, token: result.token };
      dispatch(setCredentials(payload));
      saveAuthToStorage(payload);
      router.push("/dashboard");
    } catch {
      setError("root", { message: "Invalid email or password." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to access the POS.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <p className="text-sm text-[var(--destructive)]">{errors.root.message}</p>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email", { required: "Email is required" })} />
            {errors.email && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password", { required: "Password is required" })} />
            {errors.password && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
        </form>
      </CardContent>
    </Card>
  );
}
