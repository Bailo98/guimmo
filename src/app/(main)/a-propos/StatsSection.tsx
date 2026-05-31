"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Stat {
  value: string;
  label: string;
}

export function StatsSection() {
  const [stats, setStats] = useState<Stat[]>([
    { value: "…", label: "Annonces actives" },
    { value: "…", label: "Propriétaires inscrits" },
  ]);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "owner"),
    ]).then(([properties, profiles]) => {
      setStats([
        { value: (properties.count ?? 0).toString(), label: "Annonces actives" },
        { value: (profiles.count ?? 0).toString(), label: "Propriétaires inscrits" },
      ]);
    });
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 mb-14">
      {stats.map((s) => (
        <div key={s.label} className="bg-[var(--bg-card-light)] rounded-2xl p-5 border border-[var(--border)] text-center">
          <p className="text-2xl font-black text-[#009460]">{s.value}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
