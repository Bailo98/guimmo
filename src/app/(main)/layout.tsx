import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { getContactWhatsApp } from "@/lib/site-config";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const whatsappNumber = await getContactWhatsApp();

  return (
    <>
      <Header />
      <main className="min-h-screen pt-[72px]">{children}</main>
      <Footer whatsappNumber={whatsappNumber} />
      <BottomNav />
    </>
  );
}
