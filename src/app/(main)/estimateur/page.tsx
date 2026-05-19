"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, ChevronRight, Info, TrendingUp } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

const NEIGHBORHOODS = [
  { id: "kipe", name: "Kipé" },
  { id: "ratoma", name: "Ratoma Centre" },
  { id: "lambanyi", name: "Lambanyi" },
  { id: "taouyah", name: "Taouyah" },
  { id: "hamdallaye", name: "Hamdallaye" },
  { id: "dixinn", name: "Dixinn" },
  { id: "kaloum", name: "Kaloum" },
  { id: "madina", name: "Madina" },
  { id: "matam", name: "Matam" },
  { id: "sonfonia", name: "Sonfonia" },
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "studio", label: "Studio" },
  { value: "villa", label: "Villa" },
  { value: "room", label: "Chambre" },
  { value: "office", label: "Bureau" },
];

const BASE_PRICES: Record<string, number> = {
  kipe: 2_000_000,
  ratoma: 1_800_000,
  lambanyi: 1_500_000,
  taouyah: 2_200_000,
  hamdallaye: 1_700_000,
  dixinn: 2_500_000,
  kaloum: 3_000_000,
  madina: 1_200_000,
  matam: 1_400_000,
  sonfonia: 1_300_000,
};

const TYPE_MULTIPLIER: Record<string, number> = {
  apartment: 1.0,
  house: 1.3,
  studio: 0.7,
  villa: 1.8,
  room: 0.5,
  office: 1.4,
};

function estimate(
  neighborhood: string,
  type: string,
  surface: number,
  rooms: number,
  furnished: boolean
): { min: number; max: number; mid: number } {
  const base = BASE_PRICES[neighborhood] ?? 1_500_000;
  const typeM = TYPE_MULTIPLIER[type] ?? 1.0;
  const surfaceM = surface > 0 ? surface / 80 : 1;
  const roomsM = rooms > 0 ? 0.8 + rooms * 0.1 : 1;
  const furnishedM = furnished ? 1.25 : 1.0;
  const mid = Math.round(base * typeM * surfaceM * roomsM * furnishedM);
  return { min: Math.round(mid * 0.85), max: Math.round(mid * 1.15), mid };
}


export default function EstimateurPage() {
  const [neighborhood, setNeighborhood] = useState("kipe");
  const [type, setType] = useState("apartment");
  const [surface, setSurface] = useState(80);
  const [rooms, setRooms] = useState(2);
  const [furnished, setFurnished] = useState(false);
  const [result, setResult] = useState<{ min: number; max: number; mid: number } | null>(null);

  const handleEstimate = () => {
    setResult(estimate(neighborhood, type, surface, rooms, furnished));
  };

  const avgMarket = BASE_PRICES[neighborhood] ?? 1_500_000;
  const pctDiff = result ? Math.round(((result.mid - avgMarket) / avgMarket) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#E9E900] via-[#c4c400] to-[#c2540a] text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 md:py-16">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Calculator className="w-4 h-4" />
            Outil gratuit
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Estimateur de loyer
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            Estimez le loyer de votre bien ou évaluez si une annonce est au juste prix,
            en quelques secondes.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* Form */}
          <div className="bg-[#2c2f36] rounded-2xl border border-[#1e2a30] p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
              Décrivez votre bien
            </h2>

            <div className="space-y-6">
              {/* Type de bien */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Type de bien
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f1117] border border-[#1e2a30] rounded-xl px-4 py-3 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900]/50"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quartier */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Quartier
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f1117] border border-[#1e2a30] rounded-xl px-4 py-3 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900]/50"
                >
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Surface */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Surface : <span className="text-[#E9E900]">{surface} m²</span>
                </label>
                <input
                  type="range"
                  min={15}
                  max={400}
                  step={5}
                  value={surface}
                  onChange={(e) => setSurface(Number(e.target.value))}
                  className="w-full accent-[#E9E900]"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>15 m²</span>
                  <span>400 m²</span>
                </div>
                <input
                  type="number"
                  min={15}
                  max={400}
                  value={surface}
                  onChange={(e) => setSurface(Math.max(15, Math.min(400, Number(e.target.value))))}
                  className="mt-2 w-32 bg-slate-50 dark:bg-[#0f1117] border border-[#1e2a30] rounded-xl px-3 py-2 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900]/50"
                />
              </div>

              {/* Nombre de chambres */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nombre de chambres
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRooms(n)}
                      className={cn(
                        "w-11 h-11 rounded-xl font-bold text-sm border transition-all",
                        rooms === n
                          ? "bg-[#E9E900] text-white border-[#E9E900]"
                          : "bg-slate-50 dark:bg-[#0f1117] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2a3040] hover:border-[#E9E900] hover:text-[#E9E900]"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meublé toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Meublé
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    +25% en moyenne sur le prix
                  </p>
                </div>
                <button
                  onClick={() => setFurnished((f) => !f)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors",
                    furnished ? "bg-[#E9E900]" : "bg-slate-200 dark:bg-slate-700"
                  )}
                  role="switch"
                  aria-checked={furnished}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      furnished ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* CTA */}
              <button
                onClick={handleEstimate}
                className="w-full bg-[#E9E900] hover:bg-[#c4c400] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
              >
                <Calculator className="w-5 h-5" />
                Estimer le loyer
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-5">
            {result ? (
              <>
                <div className="bg-[#2c2f36] rounded-2xl border border-[#1e2a30] p-6">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Résultat de l&apos;estimation
                  </h3>

                  {/* Range */}
                  <div className="text-center mb-5">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Fourchette estimée</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">
                      {formatPrice(result.min)} — {formatPrice(result.max)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">par mois</p>
                  </div>

                  {/* Mid */}
                  <div className="bg-gradient-to-br from-[#E9E900]/10 to-[#c4c400]/5 border border-[#E9E900]/20 rounded-xl p-4 text-center mb-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Prix estimé</p>
                    <p className="text-3xl font-black text-[#E9E900]">
                      {formatPrice(result.mid)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">par mois</p>
                  </div>

                  {/* Bar chart comparison */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Comparaison marché
                    </p>

                    <div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Votre bien</span>
                        <span>{formatPrice(result.mid)}</span>
                      </div>
                      <div className="h-3 bg-slate-100 dark:bg-[#0f1117] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E9E900] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (result.mid / (avgMarket * 2)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Prix moyen quartier</span>
                        <span>{formatPrice(avgMarket)}</span>
                      </div>
                      <div className="h-3 bg-slate-100 dark:bg-[#0f1117] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (avgMarket / (avgMarket * 2)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Diff badge */}
                  <div className={cn(
                    "mt-4 flex items-center gap-2 text-sm font-semibold rounded-xl px-3 py-2",
                    pctDiff > 0
                      ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                      : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-yellow-400"
                  )}>
                    <TrendingUp className="w-4 h-4" />
                    {pctDiff > 0
                      ? `${pctDiff}% au-dessus du prix moyen du quartier`
                      : `${Math.abs(pctDiff)}% en dessous du prix moyen du quartier`}
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 mt-4 text-xs text-slate-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <p>
                      Ces résultats sont des estimations basées sur les annonces actuelles
                      sur LogerBien. Les prix réels peuvent varier selon l&apos;état du bien
                      et les négociations.
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-[#2c2f36] rounded-2xl border border-[#1e2a30] p-5">
                  <p className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">
                    Vous êtes propriétaire ?
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                    Publiez votre annonce gratuitement et touchez des milliers de locataires.
                  </p>
                  <Link
                    href="/publier"
                    className="flex items-center justify-center gap-2 bg-[#E9E900] hover:bg-[#c4c400] text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm"
                  >
                    Publier mon annonce
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="bg-[#2c2f36] rounded-2xl border border-[#1e2a30] p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#E9E900]/10 flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-[#E9E900]" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                  Votre estimation apparaîtra ici
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Remplissez le formulaire et cliquez sur &laquo; Estimer le loyer &raquo; pour obtenir
                  une fourchette de prix basée sur le marché actuel à Conakry.
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-5">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-3">
                Conseils pour bien estimer
              </h3>
              <ul className="space-y-1.5 text-xs text-blue-700 dark:text-blue-400">
                <li>• Un bien meublé se loue 20-30% plus cher en moyenne</li>
                <li>• Kaloum et Dixinn ont les prix les plus élevés de Conakry</li>
                <li>• La surface a un impact direct proportionnel au loyer</li>
                <li>• Comparez avec des annonces similaires sur /annonces</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
