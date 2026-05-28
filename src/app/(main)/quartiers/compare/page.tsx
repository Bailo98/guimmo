"use client";
import { useState, useMemo } from "react";
import { MapPin, TrendingUp, TrendingDown, Minus, Home, Car, Trees, ShoppingBag, School } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

const NEIGHBORHOODS = [
  { id: "kipe", label: "Kipé", avgRent: 3200000, avgSale: 450000000, surface: 85, transport: 4, green: 3, shops: 4, schools: 4, safety: 4, desc: "Quartier résidentiel prisé, calme et bien équipé." },
  { id: "lambanyi", label: "Lambanyi", avgRent: 2500000, avgSale: 320000000, surface: 72, transport: 3, green: 3, shops: 3, schools: 3, safety: 3, desc: "Quartier intermédiaire avec bonne connectivité." },
  { id: "ratoma", label: "Ratoma", avgRent: 2800000, avgSale: 380000000, surface: 90, transport: 3, green: 4, shops: 4, schools: 4, safety: 3, desc: "Vaste commune avec de nombreuses commodités." },
  { id: "sonfonia", label: "Sonfonia", avgRent: 1800000, avgSale: 220000000, surface: 110, transport: 2, green: 5, shops: 2, schools: 3, safety: 4, desc: "Zone périphérique spacieuse, idéale pour les familles." },
  { id: "cosa", label: "Cosa", avgRent: 2200000, avgSale: 290000000, surface: 78, transport: 3, green: 2, shops: 3, schools: 3, safety: 3, desc: "Quartier dynamique en plein développement." },
  { id: "hamdallaye", label: "Hamdallaye", avgRent: 3500000, avgSale: 500000000, surface: 95, transport: 5, green: 2, shops: 5, schools: 4, safety: 4, desc: "Centre d'affaires animé avec toutes les commodités." },
  { id: "nongo", label: "Nongo", avgRent: 1500000, avgSale: 180000000, surface: 130, transport: 2, green: 5, shops: 2, schools: 2, safety: 4, desc: "Zone rurale calme avec grands espaces verts." },
  { id: "taouyah", label: "Taouyah", avgRent: 2600000, avgSale: 340000000, surface: 82, transport: 4, green: 3, shops: 4, schools: 4, safety: 4, desc: "Quartier résidentiel avec ambassades et hôtels." },
  { id: "dixinn", label: "Dixinn", avgRent: 4200000, avgSale: 650000000, surface: 75, transport: 5, green: 2, shops: 5, schools: 5, safety: 5, desc: "Quartier haut standing, proche du centre diplomatique." },
  { id: "matam", label: "Matam", avgRent: 2000000, avgSale: 260000000, surface: 68, transport: 4, green: 2, shops: 4, schools: 3, safety: 3, desc: "Quartier populaire commerçant très actif." },
  { id: "madina", label: "Madina", avgRent: 1900000, avgSale: 240000000, surface: 65, transport: 4, green: 1, shops: 5, schools: 3, safety: 3, desc: "Grand marché central, idéal pour les commerçants." },
  { id: "kaloum", label: "Kaloum", avgRent: 5000000, avgSale: 800000000, surface: 70, transport: 5, green: 1, shops: 5, schools: 4, safety: 5, desc: "Centre-ville, cœur économique et administratif." },
];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`w-3 h-3 rounded-sm ${i <= value ? "bg-[#D4AF37]" : "bg-slate-200 dark:bg-slate-700"}`} />
      ))}
    </div>
  );
}


type Neighborhood = typeof NEIGHBORHOODS[0];

function Diff({ a, b, field, format }: { a: Neighborhood; b: Neighborhood; field: keyof Neighborhood; format?: (v: number) => string }) {
  const va = a[field] as number;
  const vb = b[field] as number;
  const diff = va - vb;
  if (diff === 0) return <Minus className="w-3.5 h-3.5 text-slate-400 inline" />;
  const pct = Math.round((Math.abs(diff) / vb) * 100);
  const cheaper = diff < 0;
  const Icon = cheaper ? TrendingDown : TrendingUp;
  const color = field === "avgRent" || field === "avgSale"
    ? (cheaper ? "text-green-500" : "text-red-500")
    : (cheaper ? "text-red-500" : "text-green-500");
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />{pct}%
    </span>
  );
}

export default function CompareQuartiersPage() {
  const [selected, setSelected] = useState<string[]>(["kipe", "hamdallaye"]);

  const neighborhoods = useMemo(
    () => NEIGHBORHOODS.filter(n => selected.includes(n.id)),
    [selected]
  );

  function toggle(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  const CRITERIA = [
    { key: "avgRent" as const, label: "Loyer moyen/mois", icon: Home, format: formatPrice },
    { key: "avgSale" as const, label: "Prix vente moyen", icon: Home, format: formatPrice },
    { key: "surface" as const, label: "Surface moy. (m²)", icon: Home, format: (v: number) => `${v} m²` },
    { key: "transport" as const, label: "Transport", icon: Car, isStars: true },
    { key: "green" as const, label: "Espaces verts", icon: Trees, isStars: true },
    { key: "shops" as const, label: "Commerces", icon: ShoppingBag, isStars: true },
    { key: "schools" as const, label: "Écoles", icon: School, isStars: true },
    { key: "safety" as const, label: "Sécurité", icon: Home, isStars: true },
  ] as { key: keyof Neighborhood; label: string; icon: React.ElementType; format?: (v: number) => string; isStars?: boolean }[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-[#D4AF37]">Accueil</Link>
        <span>/</span>
        <Link href="/quartiers/kipe" className="hover:text-[#D4AF37]">Quartiers</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">Comparer</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">
          Comparer les quartiers
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Sélectionnez jusqu&apos;à 3 quartiers pour les comparer côte à côte.
        </p>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {NEIGHBORHOODS.map(n => (
          <button
            key={n.id}
            onClick={() => toggle(n.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              selected.includes(n.id)
                ? "bg-[#D4AF37] border-[#D4AF37] text-white"
                : "border-slate-200 dark:border-[var(--color-border)] text-slate-600 dark:text-slate-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {n.label}
          </button>
        ))}
      </div>

      {/* Compare table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--bg-card-light)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-4 text-slate-500 font-semibold w-40">Critère</th>
              {neighborhoods.map((n, i) => (
                <th key={n.id} className="px-5 py-4 text-center">
                  <div className="font-black text-slate-900 dark:text-white">{n.label}</div>
                  {i > 0 && (
                    <div className="text-xs text-slate-400 font-normal mt-0.5">vs {neighborhoods[0].label}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Description row */}
            <tr className="border-b border-[var(--color-border)] bg-[var(--bg-card-light)]">
              <td className="px-5 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">Description</td>
              {neighborhoods.map(n => (
                <td key={n.id} className="px-5 py-3 text-center text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  {n.desc}
                </td>
              ))}
            </tr>
            {CRITERIA.map((c, ci) => (
              <tr key={c.key} className={`border-b border-[var(--color-border)] ${ci % 2 === 0 ? "" : "bg-[var(--bg-card-light)]"}`}>
                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-medium">{c.label}</td>
                {neighborhoods.map((n, i) => (
                  <td key={n.id} className="px-5 py-3.5 text-center">
                    {c.isStars ? (
                      <div className="flex flex-col items-center gap-1">
                        <Stars value={n[c.key] as number} />
                        {i > 0 && <Diff a={n} b={neighborhoods[0]} field={c.key} />}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {c.format ? c.format(n[c.key] as number) : n[c.key]}
                        </span>
                        {i > 0 && <Diff a={n} b={neighborhoods[0]} field={c.key} format={c.format} />}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CTA */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {neighborhoods.map(n => (
          <Link
            key={n.id}
            href={`/quartiers/${n.id}`}
            className="flex items-center justify-between p-4 bg-[var(--bg-card-light)] rounded-2xl border border-[var(--color-border)] hover:border-[#D4AF37] transition-colors group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{n.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">Voir les annonces</p>
            </div>
            <MapPin className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
