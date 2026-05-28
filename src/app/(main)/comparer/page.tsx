"use client";
import Link from "next/link";
import Image from "next/image";
import { useAppStore } from "@/lib/store";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { formatPrice } from "@/lib/utils";
import { TrustBadge } from "@/components/ui/Badge";
import { Scale, X, Bed, Bath, Square, CheckCircle, XCircle } from "lucide-react";

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

interface RowProps {
  label: string;
  values: React.ReactNode[];
  highlight?: number;
}

function CompareRow({ label, values, highlight }: RowProps) {
  return (
    <tr className="border-b border-[#1e2a30]">
      <td className="py-3 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap w-32">{label}</td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`py-3 px-3 text-sm text-center font-medium ${
            highlight === i
              ? "text-green-600 dark:text-[#D4AF37] bg-green-50 dark:bg-green-900/10"
              : "text-slate-800 dark:text-slate-200"
          }`}
        >
          {val}
        </td>
      ))}
    </tr>
  );
}

export default function ComparerPage() {
  const { compareList, removeFromCompare, clearCompare } = useAppStore();

  const properties = compareList
    .map((id) => MOCK_PROPERTIES.find((p) => p.id === id))
    .filter(Boolean);

  if (properties.length < 2) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Scale className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Comparateur d&apos;annonces</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Sélectionnez au moins 2 annonces à comparer. Utilisez le bouton &quot;Comparer&quot; sur les cartes d&apos;annonces.
        </p>
        <Link
          href="/annonces"
          className="inline-flex items-center gap-2 bg-[#E9E900] hover:bg-[#c4c400] text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Parcourir les annonces
        </Link>
      </div>
    );
  }

  const prices = properties.map((p) => p!.price);
  const minPriceIndex = prices.indexOf(Math.min(...prices));

  return (
    <div className="max-w-5xl mx-auto px-4 pb-32 pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#E9E900]" />
            Comparateur
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {properties.length} annonce{properties.length > 1 ? "s" : ""} comparée{properties.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => clearCompare()}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm flex items-center gap-1 transition-colors"
        >
          <X className="w-4 h-4" /> Vider
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <colgroup>
            <col className="w-32" />
            {properties.map((_, i) => <col key={i} />)}
          </colgroup>
          <thead>
            <tr>
              <th />
              {properties.map((p) => p && (
                <th key={p.id} className="pb-4 px-3 align-top">
                  <div className="bg-[#2c2f36] rounded-2xl overflow-hidden border border-[#1e2a30]">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {p.property_images?.[0] ? (
                        <Image
                          src={p.property_images[0].url}
                          alt={p.title}
                          fill
                          className="object-cover"
                          sizes="300px"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 text-left">{p.title}</p>
                      <p className="text-[#E9E900] font-black text-lg text-left mt-1">{formatPrice(p.price)}</p>
                      {p.price_period === "month" && (
                        <p className="text-slate-400 text-xs text-left">/mois</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => removeFromCompare(p.id)}
                          className="flex-1 text-xs py-1.5 rounded-lg border border-[#1e2a30] text-slate-500 hover:text-red-500 hover:border-red-500 transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" /> Retirer
                        </button>
                        <Link
                          href={`/annonces/${p.id}`}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-[#E9E900] text-white font-bold text-center flex items-center justify-center hover:bg-[#c4c400] transition-colors"
                        >
                          Voir l&apos;annonce
                        </Link>
                      </div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#2c2f36] rounded-2xl">
            <CompareRow
              label="Prix"
              values={properties.map((p) => p ? (
                <span>
                  {formatPrice(p.price)}
                  {p.price_period === "month" && <span className="text-xs font-normal text-slate-400">/mois</span>}
                </span>
              ) : null)}
              highlight={minPriceIndex}
            />
            <CompareRow
              label="Meilleur prix"
              values={properties.map((_, i) => i === minPriceIndex ? (
                <span className="inline-flex items-center gap-1 text-green-600 dark:text-[#D4AF37] text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Meilleur prix
                </span>
              ) : <span className="text-slate-300 dark:text-slate-600">—</span>)}
            />
            <CompareRow
              label="Surface"
              values={properties.map((p) => p?.surface ? `${p.surface} m²` : "—")}
            />
            <CompareRow
              label="Chambres"
              values={properties.map((p) => p ? (
                <span className="flex items-center justify-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-slate-400" /> {p.rooms ?? "—"}
                </span>
              ) : null)}
            />
            <CompareRow
              label="Salles de bain"
              values={properties.map((p) => p ? (
                <span className="flex items-center justify-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-slate-400" /> {p.bathrooms ?? "—"}
                </span>
              ) : null)}
            />
            <CompareRow
              label="Meublé"
              values={properties.map((p) => p?.furnished ? (
                <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
              ))}
            />
            <CompareRow
              label="Quartier"
              values={properties.map((p) => p ? NEIGHBORHOOD_LABELS[p.neighborhood] ?? p.neighborhood : "—")}
            />
            <CompareRow
              label="Disponible"
              values={properties.map((p) => p?.available_now ? (
                <span className="text-green-600 dark:text-[#D4AF37] text-xs font-semibold">Oui</span>
              ) : (
                <span className="text-slate-400 text-xs">Non</span>
              ))}
            />
            <CompareRow
              label="Badges"
              values={properties.map((p) => p ? (
                <div className="flex flex-wrap gap-1 justify-center">
                  {p.is_boosted ? (
                    <TrustBadge key="boosted" badge={{ id: "boosted", type: "listing_verified", label: "Sponsorisé", color: "gold" }} size="sm" />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  )}
                </div>
              ) : null)}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
