"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { createNotification } from "@/lib/notifications";

interface Props {
  propertyId: string;
  ownerId: string;
  propertyTitle: string;
  isOwner?: boolean;
  className?: string;
}

function buildConvId(propId: string, uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort();
  return `${propId}__${sorted[0]}__${sorted[1]}`;
}

export function MessageButton({
  propertyId, ownerId, propertyTitle, isOwner = false, className,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [open,     setOpen]     = useState(false);
  const [content,  setContent]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Never render for the property owner or when user would message themselves
  if (isOwner) return null;
  if (user && user.id === ownerId) return null;

  async function handleClick() {
    if (!user) {
      router.push(`/connexion?redirect=/annonces/${propertyId}`);
      return;
    }

    const convId = buildConvId(propertyId, user.id, ownerId);

    // Check if a conversation already exists
    if (isSupabaseConfigured && supabase) {
      setChecking(true);
      const { data } = await supabase
        .from("messages")
        .select("id")
        .eq("property_id", propertyId)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${ownerId}),` +
          `and(sender_id.eq.${ownerId},receiver_id.eq.${user.id})`
        )
        .limit(1);
      setChecking(false);

      if (data && data.length > 0) {
        router.push(`/messages/${convId}`);
        return;
      }
    }

    setOpen(true);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setSending(true);

    const convId = buildConvId(propertyId, user.id, ownerId);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("messages").insert({
        sender_id:   user.id,
        receiver_id: ownerId,
        property_id: propertyId,
        content:     content.trim(),
      });
      if (error) {
        console.error("MessageButton send error:", JSON.stringify(error, null, 2));
        toast("Erreur lors de l'envoi. Réessayez.", "error");
        setSending(false);
        return;
      }
      await createNotification({
        userId: ownerId,
        type: "new_message",
        title: "Nouveau message",
        body: `Un utilisateur vous a écrit pour "${propertyTitle}".`,
        data: { property_id: propertyId, sender_id: user.id },
      });
    }

    toast("Message envoyé au propriétaire", "success");
    setContent("");
    setOpen(false);
    setSending(false);
    router.push(`/messages/${convId}`);
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={checking}
        className={
          className ??
          "flex items-center justify-center gap-2 w-full bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold py-3 px-4 rounded-xl transition-colors border border-[var(--border)] text-sm disabled:opacity-60"
        }
      >
        {checking
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <MessageSquare className="w-4 h-4" />
        }
        {checking ? "Vérification…" : "Envoyer un message"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[2147483647] flex items-end justify-center overflow-y-auto bg-black/70 px-3 pt-6 backdrop-blur-sm sm:items-center sm:p-4"
          style={{
            paddingBottom: "max(18px, env(safe-area-inset-bottom, 0px))",
            paddingTop: "max(18px, env(safe-area-inset-top, 0px))",
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-2xl"
            style={{ maxHeight: "calc(100dvh - 36px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div>
                <h2 className="font-bold text-[var(--text-primary)] text-base">Envoyer un message</h2>
                <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 max-w-[260px]">
                  {propertyTitle}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1e2a30] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            <form
              onSubmit={handleSend}
              className="max-h-[calc(100dvh-150px-env(safe-area-inset-bottom,0px))] space-y-4 overflow-y-auto p-5"
              style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px))" }}
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bonjour, je suis intéressé(e) par votre annonce…"
                rows={4}
                maxLength={2000}
                required
                autoFocus
                style={{ fontSize: 16 }}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/50 resize-none"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--text-muted)]">{content.length}/2000</span>
                <button
                  type="submit"
                  disabled={!content.trim() || sending}
                  className="flex min-h-12 items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-5 py-2.5 text-sm font-black text-[var(--text-primary)] transition-colors hover:bg-[#B8963A] disabled:opacity-50"
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
