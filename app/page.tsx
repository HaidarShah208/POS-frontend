import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-(--muted) p-4">
      <h1 className="text-3xl font-bold">Restaurant POS</h1>
      <p className="text-(--muted-foreground)">Point of Sale system</p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button variant="accent" asChild>
          <Link href="/pos">Open POS</Link>
        </Button>
      </div>
    </div>
  );
}
