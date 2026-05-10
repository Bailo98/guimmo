"use client";

import { useState, useMemo } from "react";
import { CheckCircle, XCircle, Shield, Search } from "lucide-react";
import { toast } from "@/lib/toast";

interface User {
  id: number;
  name: string;
  role: string;
  phone: string;
  listings: number;
  verified: boolean;
  banned: boolean;
  joined: string;
}

const INITIAL_USERS: User[] = [
  { id: 1, name: "Mamadou Diallo", role: "Agent", phone: "+224 620 000 001", listings: 24, verified: true, banned: false, joined: "Jan 2023" },
  { id: 2, name: "Fatoumata Camara", role: "Propriétaire", phone: "+224 628 000 002", listings: 3, verified: true, banned: false, joined: "Juin 2023" },
  { id: 3, name: "Ibrahim Bah", role: "Utilisateur", phone: "+224 664 000 003", listings: 1, verified: false, banned: false, joined: "Jan 2024" },
  { id: 4, name: "Agence Conakry Premium", role: "Agence", phone: "+224 620 000 100", listings: 87, verified: true, banned: false, joined: "Mar 2022" },
  { id: 5, name: "Aissatou Sylla", role: "Propriétaire", phone: "+224 628 000 005", listings: 2, verified: true, banned: false, joined: "Sep 2023" },
];

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");

  function handleVerify(id: number) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, verified: true } : u))
    );
    toast("Utilisateur vérifié", "success");
  }

  function handleBan(id: number) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, banned: true } : u))
    );
    toast("Utilisateur banni", "error");
  }

  function handleUnban(id: number) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, banned: false } : u))
    );
    toast("Bannissement levé", "success");
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.phone.includes(q)
    );
  }, [users, search]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Utilisateurs</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{filtered.length} utilisateur(s)</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full bg-white dark:bg-[#1e2430] border border-slate-200 dark:border-[#2a3040] rounded-xl pl-9 pr-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        />
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-8 border border-slate-100 dark:border-[#2a3040] text-center">
            <p className="text-slate-400 text-sm">Aucun utilisateur trouvé.</p>
          </div>
        )}
        {filtered.map((u) => (
          <div
            key={u.id}
            className={`bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] flex items-center gap-3 transition-opacity ${
              u.banned ? "opacity-50" : ""
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#F97316] to-[#EA6C0A] rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0">
              {u.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{u.name}</p>
                {u.verified && !u.banned && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                )}
                {u.banned && (
                  <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">
                    Banni
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {u.role} · {u.phone} · {u.listings} annonces · Inscrit {u.joined}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!u.verified && !u.banned && (
                <button
                  onClick={() => handleVerify(u.id)}
                  title="Vérifier"
                  className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
              )}
              {u.verified && !u.banned && (
                <button
                  disabled
                  title="Déjà vérifié"
                  className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 opacity-50 cursor-not-allowed"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
              )}
              {!u.banned ? (
                <button
                  onClick={() => handleBan(u.id)}
                  title="Bannir"
                  className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleUnban(u.id)}
                  title="Lever le bannissement"
                  className="w-8 h-8 bg-slate-100 dark:bg-[#2a3040] rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-[#3a4050] transition-colors text-xs font-bold"
                >
                  ↩
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
