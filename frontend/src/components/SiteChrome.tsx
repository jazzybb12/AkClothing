"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  logoUrl: string | null;
  children: React.ReactNode;
}

export default function SiteChrome({ categories, logoUrl, children }: Props) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header categories={categories} logoUrl={logoUrl} />
      <main className="font-rang mx-auto w-full max-w-6xl flex-1 px-4 py-8 text-ink">{children}</main>
      <Footer logoUrl={logoUrl} />
      <WhatsAppButton />
    </>
  );
}
