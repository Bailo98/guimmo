"use client";

import dynamic from "next/dynamic";

const ChatbotWidget = dynamic(
  () => import("@/components/ui/ChatbotWidget").then((module) => module.ChatbotWidget),
  { loading: () => null, ssr: false }
);

export function DeferredChatbotWidget({ whatsappNumber }: { whatsappNumber?: string }) {
  return <ChatbotWidget whatsappNumber={whatsappNumber} />;
}
