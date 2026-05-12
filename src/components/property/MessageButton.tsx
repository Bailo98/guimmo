"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/lib/toast";

interface Props {
  propertyId: string;
  ownerId: string;
  propertyTitle: string;
  className?: string;
}

export function MessageButton({ propertyId, ownerId, propertyTitle, className }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Hide only if ownerId is a real value that matches the logged-in user
  if (ownerId && user?.id === ownerId) return null;

  function handleClick() {
    if (!user) {
      router.push(`/connexion?redirect=/annonces/${propertyId}`);
      return;
    }
    setOpen(true);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setSending(true);

    if (isSupabaseConfigured && supabase) {
      const payload = {
        sender_id: user.id,
        receiver_id: ownerId,
        property_id: propertyId,
        content: content.trim(),
      };
      console.log("Sending message:", payload);
      const { error } = await supabase.from("messages").insert(payload);
      if (error) {
        toast("Erreur lors de l'envoi. Réessayez.", "error");
        setSending(false);
        return;
      }
    }

    toast("Message envoyé !", "success");
    setContent("");
    setOpen(false);
    setSending(false);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={className ?? "flex items-center justify-center gap-2 w-full bg-[#1e2430] hover:bg-[#2a3040] text-white font-semibold py-3 px-4 rounded-xl transition-colors border border-[#2a3040] text-sm"}
      >
        <MessageSquare className="w-4 h-4" />
        Envoyer un message
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#1e2430] rounded-3xl border border-slate-100 dark:border-[#2a3040] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#2a3040]">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Envoyer un message</h2>
                <p className="text-xs text-slate-400 truncate mt-0.5 max-w-[260px]">{propertyTitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#2a3040] transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-5 space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bonjour, je suis intéressé(e) par votre annonce..."
                rows={4}
                maxLength={2000}
                required
                autoFocus
                className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{content.length}/2000</span>
                <button
                  type="submit"
                  disabled={!content.trim() || sending}
                  className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
