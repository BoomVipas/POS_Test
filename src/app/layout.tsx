import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { LangProvider } from "@/lib/i18n/provider";
import { getLang } from "@/lib/i18n/server";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Cat Booth POS",
  description: "A POS for cat-product booth sellers. Apply to join the pilot.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`h-full antialiased ${nunito.variable}`}>
      <body className="min-h-dvh flex flex-col font-sans text-text">
        <LangProvider lang={lang}>
          <ToastProvider>{children}</ToastProvider>
        </LangProvider>
      </body>
    </html>
  );
}
