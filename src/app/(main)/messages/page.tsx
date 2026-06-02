"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Home, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/lib/toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type DbMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender:   { id: string; full_name: string | null } | null;
  receiver: { id: string; full_name: string | null } | null;
  property: { id: string; title: string } | null;
};

type Conversation = {
  convId: string;
  otherUserId: string;
  otherUserName: string;
  propertyId: string | null;
  propertyTitle: string;
  lastMessage: DbMessage | null;
  unreadCount: number;
  lastAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7)  return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function buildConvId(
  propertyId: string | null,
  userId: string,
  otherUserId: string
): string {
  const sorted = [userId, otherUserId].sort();
  return `${propertyId ?? "direct"}__${sorted[0]}__${sorted[1]}`;
}

function buildConversations(messages: DbMessage[], userId: string): Conversation[] {
  const map = new Map<string, Conversation>();

  for (const msg of messages) {
    const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const otherUser   = msg.sender_id === userId ? msg.receiver   : msg.sender;
    const convId = buildConvId(msg.property_id, userId, otherUserId);

    if (!map.has(convId)) {
      map.set(convId, {
        convId,
        otherUserId,
        otherUserName: otherUser?.full_name ?? "Utilisateur",
        propertyId:    msg.property_id,
        propertyTitle: msg.property?.title ?? "Annonce",
        lastMessage:   null,
        unreadCount:   0,
        lastAt:        msg.created_at,
      });
    }

    const conv = map.get(convId)!;
    if (!conv.lastMessage || msg.created_at > conv.lastMessage.created_at) {
      conv.lastMessage = msg;
    }
    if (!msg.is_read && msg.receiver_id === userId) conv.unreadCount++;
    if (msg.created_at > conv.lastAt) conv.lastAt = msg.created_at;
  }

  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyMessages() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--accent-gold)]/10 flex items-center justify-center mb-5">
        <MessageSquare className="w-9 h-9 text-[var(--accent-gold)]" />
      </div>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        Aucun message pour l&apos;instant
      </h1>
      <p className="text-[var(--text-secondary)] max-w-xs mb-6">
        Contactez un propriétaire directement depuis une annonce.
      </p>
      <Link
        href="/annonces"
        className="bg-[var(--accent-gold)] hover:bg-[#B8963A] text-[var(--text-primary)] font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Explorer les annonces
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [messages,     setMessages]     = useState<DbMessage[]>([]);
  const [fetching,     setFetching]     = useState(true);
  const [contextMenu,  setContextMenu]  = useState<string | null>(null);
  const [deletedIds,   setDeletedIds]   = useState<Set<string>>(new Set());

  const channelRef      = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/connexion?redirect=/messages");
  }, [authLoading, user, router]);

  // ── 3-step fetch (raw → profiles → properties) ────────────────────────────

  const loadMessages = useCallback(async () => {
    if (!user || !isSupabaseConfigured || !supabase) { setFetching(false); return; }

    const { data: raw, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error || !raw) { setFetching(false); return; }

    const otherIds   = [...new Set(raw.map((m) => m.sender_id === user.id ? m.receiver_id : m.sender_id))];
    const propIds    = [...new Set(raw.map((m) => m.property_id).filter(Boolean))];

    const [profilesRes, propertiesRes] = await Promise.all([
      otherIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", otherIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
      propIds.length
        ? supabase.from("properties").select("id, title").in("id", propIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

    const pMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const prMap = new Map((propertiesRes.data ?? []).map((p) => [p.id, p]));

    const enriched: DbMessage[] = raw.map((m) => ({
      ...m,
      sender:   pMap.get(m.sender_id)   ?? null,
      receiver: pMap.get(m.receiver_id) ?? null,
      property: m.property_id ? (prMap.get(m.property_id) ?? null) : null,
    }));

    setMessages(enriched);
    setFetching(false);
  }, [user]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // ── Realtime + 10 s polling ───────────────────────────────────────────────

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`messages_list_${user.id}_${Date.now()}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => loadMessages())
      .subscribe();

    const interval = setInterval(loadMessages, 10_000);
    return () => {
      clearInterval(interval);
      if (channelRef.current && supabase) supabase.removeChannel(channelRef.current);
    };
  }, [user, loadMessages]);

  // ── Delete conversation ───────────────────────────────────────────────────

  async function deleteConversation(conv: Conversation) {
    if (!user || !isSupabaseConfigured || !supabase) return;

    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }

    await supabase
      .from("messages")
      .delete()
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${conv.otherUserId}),` +
        `and(sender_id.eq.${conv.otherUserId},receiver_id.eq.${user.id})`
      );

    setDeletedIds((prev) => new Set([...prev, conv.convId]));
    setMessages((prev) => prev.filter((m) => {
      const sameUsers =
        (m.sender_id === user.id && m.receiver_id === conv.otherUserId) ||
        (m.sender_id === conv.otherUserId && m.receiver_id === user.id);
      return !sameUsers;
    }));
    setContextMenu(null);
    toast("Conversation supprimée", "success");
    setTimeout(() => loadMessages(), 1500);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (authLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const conversations = buildConversations(messages, user.id).filter((c) => !deletedIds.has(c.convId));
  const totalUnread   = conversations.reduce((s, c) => s + c.unreadCount, 0);

  if (conversations.length === 0) return <EmptyMessages />;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Messages</h1>
        {totalUnread > 0 && (
          <span className="bg-[var(--accent-gold)] text-[var(--text-primary)] text-xs font-bold px-2.5 py-1 rounded-full">
            {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {conversations.map((conv) => {
          const initial = conv.otherUserName.charAt(0).toUpperCase();
          return (
            <div key={conv.convId} className="relative group">
              <button
                onClick={() => router.push(`/messages/${conv.convId}`)}
                onTouchStart={() => {
                  longPressTimer.current = setTimeout(() => setContextMenu(conv.convId), 600);
                }}
                onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                onTouchMove={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                className="w-full text-left flex items-start gap-3 p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--bg-secondary)] hover:bg-white/5 transition-all"
                style={{ background: "var(--bg-card)" }}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-gold)] flex-shrink-0 flex items-center justify-center text-[var(--text-primary)] font-bold text-lg">
                  {initial}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-[var(--text-primary)] text-[15px] truncate">{conv.otherUserName}</p>
                    {conv.lastMessage && (
                      <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0">
                        {formatTime(conv.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <Home className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                    <p className="text-xs text-[var(--accent-gold)] font-medium truncate">{conv.propertyTitle}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] text-[var(--text-secondary)] truncate leading-snug">
                      {conv.lastMessage?.content ?? ""}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-[var(--accent-gold)] text-[var(--text-primary)] text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Desktop hover trash */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv); }}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-900/20"
                aria-label="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Mobile long-press menu */}
              {contextMenu === conv.convId && (
                <div
                  className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/40"
                  onClick={() => setContextMenu(null)}
                >
                  <div
                    className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden min-w-[180px] shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => deleteConversation(conv)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-red-400 text-sm font-semibold"
                    >
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                    <button
                      onClick={() => setContextMenu(null)}
                      className="flex items-center w-full px-4 py-3 text-[var(--text-secondary)] text-sm border-t border-[var(--border)]"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
