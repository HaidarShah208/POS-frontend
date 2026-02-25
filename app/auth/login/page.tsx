import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Restaurant POS</h1>
        <p className="text-[var(--muted-foreground)]">Sign in to your account</p>
      </div>
      <LoginForm />
    </div>
  );
}
