import { RedirectUnauthorized } from "@/components/auth/RedirectUnauthorized";
import { HomeContent } from "@/components/home/HomeContent";

export default function HomePage() {
  return (
    <RedirectUnauthorized>
      <HomeContent />
    </RedirectUnauthorized>
  );
}
