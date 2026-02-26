import type { Metadata } from "next";
import { StoreProvider } from "@/redux/provider";
import { Poppins } from "next/font/google";
import { TopLoader } from "@/components/shared/TopLoader";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Restaurant POS",
  description: "Production-grade Restaurant Point of Sale",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <StoreProvider>
          <TopLoader />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
