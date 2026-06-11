import React from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ToastProvider } from "@/components/ui/Toast";
import { CompareBar } from "@/components/compare/CompareBar";
import { PageTransition } from "@/components/ui/PageTransition";
import { ChatbotWidget } from "@/components/ui/ChatbotWidget";
import { Onboarding } from "@/components/Onboarding";
import { LowConnectionMode } from "@/components/LowConnectionMode";
import { getContactWhatsApp } from "@/lib/site-config";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const whatsappNumber = await getContactWhatsApp();

  return (
    <ToastProvider>
      <Header />
      <main className="min-h-screen pt-[72px] pb-[calc(88px+env(safe-area-inset-bottom,0px))] md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer whatsappNumber={whatsappNumber} />
      <BottomNav />
      <CompareBar />
      <Onboarding />
      <LowConnectionMode />
      <ScrollToTop />
      <ChatbotWidget whatsappNumber={whatsappNumber} />
    </ToastProvider>
  );
}
