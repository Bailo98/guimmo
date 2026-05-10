"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Flag, CheckCircle, XCircle } from "lucide-react";

type Status = "draft" | "pending" | "active" | "archived";

interface Listing {
  id: string;
  title: string;
  owner: string;
  type: string;
  date: string;
  status: Status;
}

interface ReportedListing {
  id: string;
  title: string;
  reporter: string;
  reason: string;
  date: string;
  resolved: boolean;
  approved: boolean | null;
}

const INITIAL_LISTINGS: Listing[] = [
  { id: "l1", title: "Appartement 2ch à Kipé", owner: "Sékou Kouyaté", type: "apartment", date: "2026-05-09", status: "pending" },
  { id: "l2", title: "Studio meublé Ratoma", owner: "Mariama Diallo", type: "studio", date: "2026-05-08", status: "pending" },
  { id: "l3", title: "Villa 6ch Hamdallaye", owner: "Alpha Bah", type: "villa", date: "2026-05-07", status: "draft" },
  { id: "l4", title: "Maison Taouyah", owner: "Fatoumata Camara", type: "house", date: "2026-05-06", status: "draft" },
  { id: "l5", title: "Appartement Lambanyi", owner: "Ibrahima Sow", type: "apartment", date: "2026-05-05", status: "active" },
  { id: "l6", title: "Chambre Madina", owner: "Kadiatou Barry", type: "room", date: "2026-05-04", status: "active" },
  { id: "l7", title: "Bureau Kaloum", owner: "Mamadou Keita", type: "office", date: "2026-05-01", status: "archived" },
  { id: "l8", title: "Boutique Dixinn", owner: "Hawa Diallo", type: "shop", date: "2026-04-28", status: "archived" },
];

const INITIAL_REPORTED: ReportedListing[] = [
  {
    id: "r1",
    title: "Villa 5 chambres à Coleah – trop beau pour être vrai",
    reporter: "Aissatou Barry",
    reason: "Annonce frauduleuse — photos volées d'un autre site",
    date: "2026-05-09",
    resolved: false,
    approved: null,
  },
  {
    id: "r2",
    title: "Appartement meublé Kipé – prix anormalement bas",
    reporter: "Mamadou Kouyaté",
    reason: "Prix incohérent avec le marché, soupçon d'arnaque",
    date: "2026-05-08",
    resolved: false,
    approved: null,
  },
  {
    id: "r3",
    title: "Chambre à louer Madina – contenu inapproprié",
    reporter: "Fatoumata Sow",
    reason: "Photos inappropriées dans l'annonce",
    date: "2026-05-07",
    resolved: false,
    approved: null,
  },
];

const TAB_LABELS: { status: Status; label: string }[] = [
  { status: "draft", label: "Brouillons" },
  { status: "pending", label: "En attente" },
  { status: "active", label: "Publiées" },
  { status: "archived", label: "Archivées" },
];

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  studio: "Studio",
  villa: "Villa",
  house: "Maison",
  room: "Chambre",
  office: "Bureau",
  shop: "Boutique",
};

const TYPE_COLORS: Record<string, string> = {
  apartment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  studio: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  villa: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  house: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  room: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
  office: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  shop: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

export default function AdminModerationPage() {
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [activeTab, setActiveTab] = useState<Status>("pending");
  const [reported, setReported] = useState<ReportedListing[]>(INITIAL_REPORTED);

  function changeStatus(id: string, newStatus: Status) {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
  }

  function handleAction(listing: Listing, action: "submit" | "approve" | "reject" | "archive" | "republish") {
    switch (action) {
      case "submit":
        changeStatus(listing.id, "pending");
        toast("Annonce envoyée en révision.", "info");
        break;
      case "approve":
        changeStatus(listing.id, "active");
        toast("Annonce approuvée !", "success");
        break;
      case "reject":
        changeStatus(listing.id, "archived");
        toast("Annonce rejetée.", "error");
        break;
      case "archive":
        changeStatus(listing.id, "archived");
        toast("Annonce archivée.", "info");
        break;
      case "republish":
        changeStatus(listing.id, "active");
        toast("Annonce republiée !", "success");
        break;
    }
  }

  function handleReportAction(id: string, action: "approve" | "reject") {
    setReported((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, resolved: true, approved: action === "approve" } : r
      )
    );
    toast(
      action === "approve" ? "Signalement approuvé — annonce maintenue." : "Annonce retirée suite au signalement.",
      action === "approve" ? "success" : "error"
    );
  }

  const tabCounts = TAB_LABELS.reduce<Record<Status, number>>(
    (acc, t) => {
      acc[t.status] = listings.filter((l) => l.status === t.status).length;
      return acc;
    },
    { draft: 0, pending: 0, active: 0, archived: 0 }
  );

  const visibleListings = listings.filter((l) => l.status === activeTab);
  const pendingReports = reported.filter((r) => !r.resolved);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Modération des annonces</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez le cycle de vie de chaque annonce</p>
      </div>

      {/* Reported listings section */}
      {reported.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-red-500" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Annonces signalées
            </h2>
            {pendingReports.length > 0 && (
              <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                {pendingReports.length}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {reported.map((r) => (
              <div
                key={r.id}
                className={`bg-white dark:bg-[#1e2430] rounded-2xl p-4 border ${
                  r.resolved
                    ? "border-slate-100 dark:border-[#2a3040] opacity-60"
                    : "border-red-200 dark:border-red-900/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                      {r.title}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{r.reason}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Signalé par <span className="font-medium text-slate-600 dark:text-slate-300">{r.reporter}</span> · {r.date}
                    </p>
                  </div>
                  {r.resolved ? (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                      r.approved
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {r.approved ? "Maintenue" : "Retirée"}
                    </span>
                  ) : (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleReportAction(r.id, "approve")}
                        className="flex items-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approuver
                      </button>
                      <button
                        onClick={() => handleReportAction(r.id, "reject")}
                        className="flex items-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div>
        <h2 className="font-bold text-slate-900 dark:text-white text-base mb-3">Toutes les annonces</h2>
        <div className="flex gap-1 bg-slate-100 dark:bg-[#151922] p-1 rounded-xl overflow-x-auto">
          {TAB_LABELS.map((t) => (
            <button
              key={t.status}
              onClick={() => setActiveTab(t.status)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === t.status
                  ? "bg-[#F97316] text-white shadow"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === t.status
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-[#2a3040] text-slate-600 dark:text-slate-400"
                }`}
              >
                {tabCounts[t.status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Listing items */}
      <div className="space-y-3">
        {visibleListings.length === 0 && (
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-8 border border-slate-100 dark:border-[#2a3040] text-center">
            <p className="text-slate-400 text-sm">Aucune annonce dans cette catégorie.</p>
          </div>
        )}
        {visibleListings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040]"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{listing.title}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[listing.type] ?? "bg-slate-100 text-slate-600"}`}>
                    {TYPE_LABELS[listing.type] ?? listing.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{listing.owner} · {listing.date}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {listing.status === "draft" && (
                <button
                  onClick={() => handleAction(listing, "submit")}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6C0A] transition-colors"
                >
                  Envoyer en révision
                </button>
              )}
              {listing.status === "pending" && (
                <>
                  <button
                    onClick={() => handleAction(listing, "approve")}
                    className="flex items-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    ✓ Approuver
                  </button>
                  <button
                    onClick={() => handleAction(listing, "reject")}
                    className="flex items-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    ✗ Rejeter
                  </button>
                </>
              )}
              {listing.status === "active" && (
                <button
                  onClick={() => handleAction(listing, "archive")}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors"
                >
                  Archiver
                </button>
              )}
              {listing.status === "archived" && (
                <button
                  onClick={() => handleAction(listing, "republish")}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors"
                >
                  Republier
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
