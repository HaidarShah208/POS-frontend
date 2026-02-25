"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginFormValues = { email: string; password: string };

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();

  const onSubmit = (data: LoginFormValues) => console.log("Login", data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to access the POS.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
      </CardContent>
    </Card>
  );
}
