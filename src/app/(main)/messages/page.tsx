"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, MessageSquare, Home, Trash2 } from "lucide-react";
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
  sender: { id: string; full_name: string | null } | null;
  receiver: { id: string; full_name: string | null } | null;
  property: { id: string; title: string } | null;
};

type Conversation = {
  key: string;
  otherUserId: string;
  otherUserName: string;
  propertyId: string | null;
  propertyTitle: string;
  messages: DbMessage[];
  unreadCount: number;
  lastAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function buildConversations(messages: DbMessage[], userId: string): Conversation[] {
  const map = new Map<string, Conversation>();

  for (const msg of messages) {
    const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const otherUser   = msg.sender_id === userId ? msg.receiver : msg.sender;
    const key = `${msg.property_id ?? "direct"}_${otherUserId}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        otherUserId,
        otherUserName: otherUser?.full_name ?? "Utilisateur",
        propertyId: msg.property_id,
        propertyTitle: msg.property?.title ?? "Annonce",
        messages: [],
        unreadCount: 0,
        lastAt: msg.created_at,
      });
    }

    const conv = map.get(key)!;
    conv.messages.push(msg);
    if (!msg.is_read && msg.receiver_id === userId) conv.unreadCount++;
    if (msg.created_at > conv.lastAt) conv.lastAt = msg.created_at;
  }

  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyMessages() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[#F97316]/10 flex items-center justify-center mb-5">
        <MessageSquare className="w-9 h-9 text-[#F97316]" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Vous n&apos;avez pas encore de messages.
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6">
        Contactez un propriétaire directement depuis une annonce.
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [messages, setMessages]       = useState<DbMessage[]>([]);
  const [fetching, setFetching]       = useState(true);
  const [activeKey, setActiveKey]     = useState<string | null>(null);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const messagesEndRef                = useRef<HTMLDivElement>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);
  const longPressTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDeletingRef                 = useRef(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace("/connexion?redirect=/messages");
  }, [authLoading, user, router]);

  // Load all messages (3-step: raw messages → profiles + properties → enrich)
  const loadMessages = useCallback(async () => {
    if (!user || !isSupabaseConfigured || !supabase) { setFetching(false); return; }

    const { data: raw, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error || !raw) { setFetching(false); return; }

    const otherUserIds = [...new Set(raw.map((m) =>
      m.sender_id === user.id ? m.receiver_id : m.sender_id
    ))];
    const propertyIds = [...new Set(raw.map((m) => m.property_id).filter(Boolean))];

    const [profilesRes, propertiesRes] = await Promise.all([
      otherUserIds.length > 0
        ? supabase.from("profiles").select("id, full_name").in("id", otherUserIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
      propertyIds.length > 0
        ? supabase.from("properties").select("id, title").in("id", propertyIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const propertyMap = new Map((propertiesRes.data ?? []).map((p) => [p.id, p]));

    const enriched: DbMessage[] = raw.map((m) => ({
      ...m,
      sender: profileMap.get(m.sender_id) ?? null,
      receiver: profileMap.get(m.receiver_id) ?? null,
      property: m.property_id ? (propertyMap.get(m.property_id) ?? null) : null,
    }));

    setMessages(enriched);
    setFetching(false);
  }, [user]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (isDeletingRef.current) return;
          const msg = payload.new as { sender_id: string; receiver_id: string };
          if (msg.sender_id !== user.id && msg.receiver_id !== user.id) return;
          loadMessages();
        }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [user, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeKey]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  // Mark messages as read when opening a conversation
  async function openConversation(conv: Conversation) {
    setActiveKey(conv.key);
    if (!user || !isSupabaseConfigured || !supabase || conv.unreadCount === 0) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", conv.otherUserId)
      .eq("is_read", false);

    setMessages((prev) =>
      prev.map((m) =>
        m.sender_id === conv.otherUserId && m.receiver_id === user.id && !m.is_read
          ? { ...m, is_read: true }
          : m
      )
    );
  }

  async function deleteConversation(conv: Conversation) {
    if (!user || !isSupabaseConfigured || !supabase) return;

    isDeletingRef.current = true;
    const { error, count } = await supabase
      .from("messages")
      .delete({ count: "exact" })
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("property_id", conv.propertyId);
    console.log("DELETE result:", { error, count });
    isDeletingRef.current = false;

    setMessages((prev) => prev.filter((m) => {
      const sameUsers =
        (m.sender_id === user.id && m.receiver_id === conv.otherUserId) ||
        (m.sender_id === conv.otherUserId && m.receiver_id === user.id);
      const sameProp = conv.propertyId ? m.property_id === conv.propertyId : !m.property_id;
      return !(sameUsers && sameProp);
    }));

    if (activeKey === conv.key) setActiveKey(null);
    setContextMenu(null);
    toast("Conversation supprimée", "success");
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user || !activeConv || !isSupabaseConfigured || !supabase) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: activeConv.otherUserId,
      property_id: activeConv.propertyId,
      content: input.trim(),
    });

    if (!error) setInput("");
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }
  }

  if (authLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const conversations = buildConversations(messages, user.id);
  const activeConv    = conversations.find((c) => c.key === activeKey) ?? null;
  const totalUnread   = conversations.reduce((s, c) => s + c.unreadCount, 0);

  if (conversations.length === 0) return <EmptyMessages />;

  return (
    <div
      className="flex overflow-hidden bg-slate-50 dark:bg-[#0f1117]"
      style={{ height: "calc(100dvh - 4rem - env(safe-area-inset-bottom, 0px))" }}
    >
      {/* ── Conversation list ───────────────────────────────────────────────── */}
      <aside
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 dark:border-[#2a3040] bg-white dark:bg-[#1e2430] flex flex-col ${activeKey ? "hidden md:flex" : "flex"}`}
      >
        <div className="px-4 py-4 border-b border-slate-100 dark:border-[#2a3040]">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h1>
          {totalUnread > 0 && (
            <p className="text-xs text-[#F97316] font-medium mt-0.5">
              {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const initial = conv.otherUserName.charAt(0).toUpperCase();
            return (
              <div key={conv.key} className="relative group border-b border-slate-50 dark:border-[#252d3d]">
                <button
                  onClick={() => openConversation(conv)}
                  onTouchStart={() => {
                    longPressTimer.current = setTimeout(() => setContextMenu(conv.key), 500);
                  }}
                  onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                  onTouchMove={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#252d3d] transition-colors ${
                    activeKey === conv.key ? "bg-[#F97316]/5 dark:bg-[#F97316]/10 border-l-2 border-l-[#F97316]" : ""
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-[#F97316] flex-shrink-0 flex items-center justify-center text-white font-bold text-base">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{conv.otherUserName}</p>
                      {lastMsg && <span className="text-[10px] text-slate-400 flex-shrink-0">{formatTime(lastMsg.created_at)}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Home className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-[#F97316] font-medium truncate">{conv.propertyTitle}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{lastMsg?.content ?? ""}</p>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 bg-[#F97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Desktop: trash icon on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv); }}
                  className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Supprimer la conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Mobile: long-press context menu */}
                {contextMenu === conv.key && (
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/20"
                    onClick={() => setContextMenu(null)}
                  >
                    <div
                      className="bg-white dark:bg-[#1e2430] rounded-2xl shadow-xl border border-slate-100 dark:border-[#2a3040] overflow-hidden min-w-[180px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => deleteConversation(conv)}
                        className="flex items-center gap-2 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                      <button
                        onClick={() => setContextMenu(null)}
                        className="flex items-center gap-2 w-full px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252d3d] text-sm border-t border-slate-100 dark:border-[#2a3040]"
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
      </aside>

      {/* ── Message thread ──────────────────────────────────────────────────── */}
      <main className={`flex-1 flex flex-col overflow-hidden ${activeKey ? "flex" : "hidden md:flex"}`}>
        {activeConv ? (
          <>
            {/* Thread header */}
            <div className="bg-white dark:bg-[#1e2430] border-b border-slate-200 dark:border-[#2a3040] px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setActiveKey(null)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#252d3d] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
              <div className="w-10 h-10 rounded-full bg-[#F97316] flex-shrink-0 flex items-center justify-center text-white font-bold">
                {activeConv.otherUserName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{activeConv.otherUserName}</p>
                <div className="flex items-center gap-1">
                  <Home className="w-3 h-3 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activeConv.propertyTitle}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 bg-slate-50 dark:bg-[#0f1117]">
              {activeConv.messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-[#F97316] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mr-2 self-end mb-4">
                        {activeConv.otherUserName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-[#F97316] text-white rounded-br-sm"
                            : "bg-white dark:bg-[#1e2430] text-slate-900 dark:text-white border border-slate-100 dark:border-[#2a3040] rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="bg-white dark:bg-[#1e2430] border-t border-slate-100 dark:border-[#2a3040] px-4 py-3"
            >
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message…"
                  rows={1}
                  className="flex-1 resize-none bg-slate-100 dark:bg-[#252d3d] text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 max-h-32 overflow-y-auto"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4 -rotate-45 translate-x-0.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
            </form>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-8 bg-slate-50 dark:bg-[#0f1117]">
            <div className="w-20 h-20 rounded-full bg-[#F97316]/10 flex items-center justify-center mb-5">
              <MessageSquare className="w-9 h-9 text-[#F97316]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Vos messages</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs">
              Sélectionnez une conversation à gauche pour lire et répondre.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
