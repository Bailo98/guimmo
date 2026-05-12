import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ToastProvider } from "@/components/ui/Toast";
import { CompareBar } from "@/components/compare/CompareBar";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { PageTransition } from "@/components/ui/PageTransition";
import { WhatsAppWidget } from "@/components/ui/WhatsAppWidget";
import { ChatbotWidget } from "@/components/ui/ChatbotWidget";
import { getContactWhatsApp } from "@/lib/site-config";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const whatsappNumber = await getContactWhatsApp();

  return (
    <ToastProvider>
      <Header />
      <main className="min-h-screen pb-20 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer whatsappNumber={whatsappNumber} />
      <BottomNav />
      <CompareBar />
      <OnboardingModal />
      <ScrollToTop />
      <WhatsAppWidget whatsappNumber={whatsappNumber} />
      <ChatbotWidget whatsappNumber={whatsappNumber} />
    </ToastProvider>
  );
}
