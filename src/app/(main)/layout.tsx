import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/ui/PageTransition";
import { Onboarding } from "@/components/Onboarding";
import { ChatbotWidget } from "@/components/ui/ChatbotWidget";
import BudgetEstimator from "@/components/BudgetEstimator";
import { CompareBar } from "@/components/compare/CompareBar";
import { LowConnectionMode } from "@/components/LowConnectionMode";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { getContactWhatsApp } from "@/lib/site-config";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const whatsappNumber = await getContactWhatsApp();

  return (
    <>
      <Header />
      <main className="min-h-screen pt-[72px]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer whatsappNumber={whatsappNumber} />
      <BottomNav />
      <CompareBar />
      <Onboarding />
      <ChatbotWidget whatsappNumber={whatsappNumber} />
      <BudgetEstimator />
      <LowConnectionMode />
      <ScrollToTop />
    </>
  );
}
