"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";

type MessageFrom = "bot" | "user";

interface Message {
  from: MessageFrom;
  text: string;
  options?: string[];
  link?: { label: string; href: string };
}

type Step =
  | "start"
  | "rent-budget"
  | "rent-neighborhood"
  | "rent-done"
  | "buy-done"
  | "publish-done"
  | "other-done";

const NEIGHBORHOOD_SLUGS: Record<string, string> = {
  Kipé: "kipe",
  Ratoma: "ratoma",
  Hamdallaye: "hamdallaye",
  Taouyah: "taouyah",
  Autre: "autre",
};

const INITIAL_MESSAGE: Message = {
  from: "bot",
  text: "Bonjour ! 👋 Je suis l'assistant GuImmo. Que cherchez-vous ?",
  options: [
    "Louer un appartement",
    "Acheter une maison",
    "Publier une annonce",
    "Autre chose",
  ],
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("start");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [rentBudget, setRentBudget] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function addUserMessage(text: string) {
    setMessages((prev) => [...prev, { from: "user", text }]);
  }

  function addBotMessage(msg: Message) {
    setTimeout(() => {
      setMessages((prev) => [...prev, msg]);
    }, 600);
  }

  function handleOption(option: string) {
    addUserMessage(option);

    if (step === "start") {
      if (option === "Louer un appartement") {
        setStep("rent-budget");
        addBotMessage({
          from: "bot",
          text: "Super ! Quel est votre budget mensuel ?",
          options: [
            "< 500 000 GNF",
            "500k - 1M GNF",
            "1M - 3M GNF",
            "> 3M GNF",
          ],
        });
      } else if (option === "Acheter une maison") {
        setStep("buy-done");
        addBotMessage({
          from: "bot",
          text: "Je vous montre toutes nos annonces à vendre.",
          link: { label: "Voir les ventes", href: "/annonces?transactionType=sale" },
        });
      } else if (option === "Publier une annonce") {
        setStep("publish-done");
        addBotMessage({
          from: "bot",
          text: "Publiez gratuitement votre annonce sur GuImmo !",
          link: { label: "Publier maintenant", href: "/publier" },
        });
      } else if (option === "Autre chose") {
        setStep("other-done");
        addBotMessage({
          from: "bot",
          text: "Contactez notre équipe sur WhatsApp pour toute autre question !",
          link: {
            label: "Ouvrir WhatsApp",
            href: "https://wa.me/224620000000?text=Bonjour%20GuImmo%2C%20j%27ai%20besoin%20d%27aide",
          },
        });
      }
    } else if (step === "rent-budget") {
      setRentBudget(option);
      setStep("rent-neighborhood");
      addBotMessage({
        from: "bot",
        text: "Dans quel quartier ?",
        options: ["Kipé", "Ratoma", "Hamdallaye", "Taouyah", "Autre"],
      });
    } else if (step === "rent-neighborhood") {
      const slug = NEIGHBORHOOD_SLUGS[option] ?? "autre";
      const href =
        slug === "autre"
          ? "/annonces?transactionType=rent"
          : `/annonces?transactionType=rent&neighborhood=${slug}`;
      setStep("rent-done");
      addBotMessage({
        from: "bot",
        text: "Parfait ! Je vous montre les annonces correspondantes 🏠",
        link: { label: "Voir les annonces", href },
      });
    }
  }

  function handleReset() {
    setStep("start");
    setRentBudget("");
    setMessages([INITIAL_MESSAGE]);
  }

  const lastBotMsg = [...messages].reverse().find((m) => m.from === "bot");

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-40 left-4 z-50 w-80 md:bottom-24"
          >
            <div className="flex h-96 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              {/* Header */}
              <div className="flex items-center justify-between bg-[#F97316] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    GI
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white leading-none">
                      Assistant GuImmo
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                      <span className="text-[10px] text-orange-100">En ligne</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                  aria-label="Fermer le chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 ${
                      msg.from === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {msg.from === "bot" && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-[9px] font-bold text-white">
                        GI
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                        msg.from === "user"
                          ? "rounded-br-sm bg-[#F97316] text-white"
                          : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies / action buttons */}
              {lastBotMsg && (lastBotMsg.options || lastBotMsg.link) && (
                <div className="border-t border-slate-100 dark:border-slate-700 p-3 space-y-2">
                  {lastBotMsg.options && (
                    <div className="flex flex-wrap gap-1.5">
                      {lastBotMsg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleOption(opt)}
                          className="rounded-full border border-[#F97316] px-3 py-1 text-xs font-medium text-[#F97316] transition hover:bg-[#F97316] hover:text-white dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-500 dark:hover:text-white"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {lastBotMsg.link && (
                    <a
                      href={lastBotMsg.link.href}
                      target={
                        lastBotMsg.link.href.startsWith("http")
                          ? "_blank"
                          : undefined
                      }
                      rel={
                        lastBotMsg.link.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="block w-full rounded-xl bg-[#F97316] py-2 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      {lastBotMsg.link.label}
                    </a>
                  )}
                  {(step === "rent-done" ||
                    step === "buy-done" ||
                    step === "publish-done" ||
                    step === "other-done") && (
                    <button
                      onClick={handleReset}
                      className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    >
                      Recommencer ↩
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <div className="fixed bottom-24 left-4 z-50 md:bottom-8 group">
        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block">
          <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg dark:bg-slate-700">
            Assistant virtuel
            <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
          </div>
        </div>
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#F97316] shadow-[0_4px_24px_rgba(249,115,22,0.5)]"
          aria-label="Ouvrir l'assistant virtuel"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-6 w-6 text-white" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <MessageSquare className="h-6 w-6 text-white" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
