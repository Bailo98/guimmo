"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Home } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return (
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const { conversationId } = useParams() as { conversationId: string };
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Parse: "propertyId__uid1__uid2"  (double-underscore separator, UUIDs only contain hyphens)
  const parts    = conversationId.split("__");
  const rawPropId = parts[0];
  const uid1     = parts[1] ?? "";
  const uid2     = parts[2] ?? "";
  const propId   = rawPropId === "direct" ? null : rawPropId;

  const meId    = user?.id ?? "";
  const otherId = meId && uid1 && uid2 ? (uid1 === meId ? uid2 : uid1) : "";

  const [messages,       setMessages]       = useState<Message[]>([]);
  const [otherName,      setOtherName]      = useState("Utilisateur");
  const [propertyTitle,  setPropertyTitle]  = useState("Annonce");
  const [fetching,       setFetching]       = useState(true);
  const [input,          setInput]          = useState("");
  const [sending,        setSending]        = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const channelRef   = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/connexion?redirect=/messages");
  }, [authLoading, user, router]);

  // ── Fetch messages ────────────────────────────────────────────────────────

  const loadMessages = useCallback(async () => {
    if (!meId || !otherId || !isSupabaseConfigured || !supabase) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${meId},receiver_id.eq.${otherId}),` +
        `and(sender_id.eq.${otherId},receiver_id.eq.${meId})`
      );

    if (propId) {
      q = q.eq("property_id", propId);
    } else {
      q = q.is("property_id", null);
    }

    const { data } = await q.order("created_at", { ascending: true }).limit(100);
    if (data) setMessages(data as Message[]);
    setFetching(false);

    // Mark received messages as read
    if (data?.some((m: Message) => !m.is_read && m.receiver_id === meId)) {
      const markQ = supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", meId)
        .eq("sender_id", otherId)
        .eq("is_read", false);
      if (propId) markQ.eq("property_id", propId);
      await markQ;
    }
  }, [meId, otherId, propId]);

  // ── Load profiles + property title ────────────────────────────────────────

  useEffect(() => {
    if (!meId || !otherId || !supabase) return;
    loadMessages();

    supabase.from("profiles").select("full_name").eq("id", otherId).single()
      .then(({ data }) => { if (data?.full_name) setOtherName(data.full_name); });

    if (propId) {
      supabase.from("properties").select("title").eq("id", propId).single()
        .then(({ data }) => { if (data?.title) setPropertyTitle(data.title); });
    }
  }, [meId, otherId, propId, loadMessages]);

  // ── Realtime subscription + 8 s polling ──────────────────────────────────

  useEffect(() => {
    if (!meId || !otherId || !isSupabaseConfigured || !supabase) return;

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel(`conv_${conversationId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          ...(propId ? { filter: `property_id=eq.${propId}` } : {}),
        },
        (payload) => {
          const msg = payload.new as Message;
          const relevant =
            (msg.sender_id === meId && msg.receiver_id === otherId) ||
            (msg.sender_id === otherId && msg.receiver_id === meId);
          const propMatch = propId ? msg.property_id === propId : !msg.property_id;
          if (!relevant || !propMatch) return;

          setMessages((prev) => {
            // Deduplicate (might arrive via optimistic update already)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          // Mark as read if I'm the receiver
          if (msg.receiver_id === meId && supabase) {
            supabase.from("messages").update({ is_read: true }).eq("id", msg.id).then(() => {});
          }
        }
      )
      .subscribe();

    const interval = setInterval(loadMessages, 8_000);
    return () => {
      clearInterval(interval);
      if (channelRef.current && supabase) supabase.removeChannel(channelRef.current);
    };
  }, [meId, otherId, propId, conversationId, loadMessages]);

  // ── Scroll to bottom on new messages ─────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  // ── Send message ──────────────────────────────────────────────────────────

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !meId || !otherId || !supabase || sending) return;
    if (meId === otherId) return; // never allow self-messaging

    setSending(true);
    const content = input.trim();
    setInput("");

    // Optimistic update
    const tempId  = `temp_${Date.now()}`;
    const tempMsg: Message = {
      id: tempId, sender_id: meId, receiver_id: otherId,
      property_id: propId, content, is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ sender_id: meId, receiver_id: otherId, property_id: propId, content })
      .select()
      .single();

    if (error) {
      console.error("Erreur envoi:", JSON.stringify(error, null, 2));
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(content);
    } else if (inserted) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? inserted as Message : m));
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  // ── Loading / auth guard ──────────────────────────────────────────────────

  if (authLoading || (fetching && meId && otherId)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col bg-[var(--bg-primary)]"
      style={{ height: "calc(100dvh - 4rem - 4rem - env(safe-area-inset-bottom, 0px))" }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]"
        style={{ background: "var(--bg-primary)" }}
      >
        <button
          onClick={() => router.push("/messages")}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>

        <div className="w-10 h-10 rounded-full bg-[var(--accent-gold)] flex-shrink-0 flex items-center justify-center text-[var(--text-primary)] font-bold">
          {otherName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[var(--text-primary)] text-sm leading-tight">{otherName}</p>
          {propId && (
            <Link href={`/annonces/${propId}`} className="flex items-center gap-1 group mt-0.5">
              <Home className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
              <p className="text-xs text-[var(--text-secondary)] truncate group-hover:text-[var(--accent-gold)] transition-colors">
                {propertyTitle}
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !fetching && (
          <div className="flex items-center justify-center h-full py-12">
            <p className="text-[var(--text-muted)] text-sm text-center">
              Aucun message encore. Soyez le premier à écrire !
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === meId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-[var(--accent-gold)] flex-shrink-0 flex items-center justify-center text-[var(--text-primary)] text-xs font-bold mr-2 self-end mb-5">
                  {otherName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? "bg-[var(--accent-gold)] text-[var(--text-primary)]"
                      : "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)]"
                  }`}
                  style={{
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {formatTime(msg.created_at)}
                  </span>
                  {isMe && msg.is_read && (
                    <span className="text-[10px] text-[var(--accent-gold)]" title="Lu">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 px-4 py-3 border-t border-[var(--border)]"
        style={{
          background: "var(--bg-primary)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message…"
            rows={1}
            style={{ fontSize: 16 }}
            className="flex-1 resize-none bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/50 max-h-32 overflow-y-auto"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--accent-gold)] hover:bg-[#B8963A] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-primary)] transition-all flex-shrink-0"
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send className="w-4 h-4 -rotate-45 translate-x-0.5" />
            }
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] text-center mt-1.5">
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </p>
      </form>
    </div>
  );
}
