"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Home, MoreVertical, Phone, MessageSquare } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Conversation } from "@/lib/store";
import { EmptyState } from "@/components/ui/EmptyState";

const QUICK_REPLIES = [
  "Toujours disponible ?",
  "Je suis intéressé(e)",
  "Quel est le loyer charges comprises ?",
];

function avatarColor(initial: string): string {
  const map: Record<string, string> = {
    M: "bg-[#F97316]",
    F: "bg-[#ea6c0a]",
    I: "bg-[#fb923c]",
    A: "bg-[#c2540a]",
    B: "bg-[#9a3412]",
    D: "bg-[#f59e0b]",
  };
  return map[initial] ?? "bg-[#F97316]";
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) {
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function getUnreadCount(conv: Conversation): number {
  return conv.messages.filter(
    (m) => m.from === "them" && m.sentAt > conv.lastRead
  ).length;
}

export default function MessagesPage() {
  const conversations = useAppStore((s) => s.conversations);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const markConversationRead = useAppStore((s) => s.markConversationRead);

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  function openConversation(id: string) {
    setActiveConvId(id);
    markConversationRead(id);
  }

  function handleSend(text?: string) {
    const t = (text ?? input).trim();
    if (!t || !activeConvId) return;
    sendMessage(activeConvId, t);
    if (!text) setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const totalUnread = conversations.reduce((s, c) => s + getUnreadCount(c), 0);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0f1117] flex overflow-hidden" style={{ height: "calc(100dvh - 4rem - env(safe-area-inset-bottom, 0px))" }}>
      {/* Conversation list */}
      <aside
        className={`
          w-full md:w-80 lg:w-96 flex-shrink-0
          border-r border-slate-200 dark:border-[#2a3040]
          bg-white dark:bg-[#1e2430]
          flex flex-col
          ${activeConvId ? "hidden md:flex" : "flex"}
        `}
      >
        {/* List header */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-[#2a3040]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Messages
              </h1>
              {totalUnread > 0 && (
                <p className="text-xs text-[#F97316] font-medium mt-0.5">
                  {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={MessageSquare}
                title="Aucun message"
                description="Vous n'avez pas encore de conversations."
              />
            </div>
          ) : (
            conversations.map((conv) => {
              const unread = getUnreadCount(conv);
              const lastMsg = conv.messages[conv.messages.length - 1];
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#252d3d] transition-colors border-b border-slate-50 dark:border-[#252d3d] ${
                    activeConvId === conv.id
                      ? "bg-[#F97316]/5 dark:bg-[#F97316]/10 border-l-2 border-l-[#F97316]"
                      : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-base ${avatarColor(conv.participantAvatar)}`}
                  >
                    {conv.participantAvatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {conv.participantName}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatTime(lastMsg.sentAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Home className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-[#F97316] font-medium truncate">{conv.propertyTitle}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-snug">
                        {lastMsg ? lastMsg.text : "Aucun message"}
                      </p>
                      {unread > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 bg-[#F97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Message thread */}
      <main
        className={`
          flex-1 flex flex-col overflow-hidden
          ${activeConvId ? "flex" : "hidden md:flex"}
        `}
      >
        {activeConvId && activeConv ? (
          <>
            {/* Thread header */}
            <div className="bg-white dark:bg-[#1e2430] border-b border-slate-200 dark:border-[#2a3040] px-4 py-3 flex items-center gap-3">
              {/* Back button (mobile) */}
              <button
                onClick={() => setActiveConvId(null)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#252d3d] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${avatarColor(activeConv.participantAvatar)}`}
              >
                {activeConv.participantAvatar}
              </div>

              {/* Contact info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {activeConv.participantName}
                </p>
                <div className="flex items-center gap-1">
                  <Home className="w-3 h-3 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {activeConv.propertyTitle}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <a
                  href={`tel:${activeConv.participantPhone}`}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#252d3d] transition-colors text-slate-600 dark:text-slate-400"
                  aria-label="Appeler"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#252d3d] transition-colors text-slate-600 dark:text-slate-400">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 bg-slate-50 dark:bg-[#0f1117]">
              {activeConv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                >
                  {/* Their avatar */}
                  {msg.from === "them" && (
                    <div
                      className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mr-2 self-end mb-4 ${avatarColor(activeConv.participantAvatar)}`}
                    >
                      {activeConv.participantAvatar}
                    </div>
                  )}

                  <div className={`max-w-[75%] flex flex-col ${msg.from === "me" ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.from === "me"
                          ? "bg-[#F97316] text-white rounded-br-sm"
                          : "bg-white dark:bg-[#1e2430] text-slate-900 dark:text-white border border-slate-100 dark:border-[#2a3040] rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {formatTime(msg.sentAt)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <div className="bg-white dark:bg-[#1e2430] border-t border-slate-200 dark:border-[#2a3040] px-4 pt-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors mb-2"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="bg-white dark:bg-[#1e2430] border-t border-slate-100 dark:border-[#2a3040] px-4 py-3">
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message…"
                  rows={1}
                  className="flex-1 resize-none bg-slate-100 dark:bg-[#252d3d] text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 transition-all max-h-32 overflow-y-auto"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4 -rotate-45 translate-x-0.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
              </p>
            </div>
          </>
        ) : (
          /* Empty state (desktop when no conv selected) */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-8 bg-slate-50 dark:bg-[#0f1117]">
            <div className="w-20 h-20 rounded-full bg-[#F97316]/10 flex items-center justify-center mb-5">
              <Send className="w-9 h-9 text-[#F97316] -rotate-12" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Vos messages
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs">
              Sélectionnez une conversation à gauche pour lire et répondre aux messages.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
