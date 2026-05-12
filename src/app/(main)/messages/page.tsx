"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[#F97316]/10 flex items-center justify-center mb-5">
        <MessageSquare className="w-9 h-9 text-[#F97316]" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Vous n&apos;avez pas encore de messages.
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6">
        Contactez un propriétaire via WhatsApp directement depuis une annonce.
      </p>
      <Link
        href="/annonces"
        className="bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Voir les annonces
      </Link>
    </div>
  );
}
