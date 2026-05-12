import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, MapPin, Bed, Bath, Square, Phone, CheckCircle, XCircle } from "lucide-react";
import { PhotoGallery } from "./PhotoGallery";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { MessageButton } from "@/components/property/MessageButton";
import { getNeighborhoodName } from "@/data/neighborhoods";
import type { Metadata } from "next";
import type { Property } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

const FEATURE_LABELS: Record<string, string> = {
  wifi: "WiFi", clim: "Climatisation", groupe: "Groupe électrogène",
  parking: "Parking", piscine: "Piscine", gardien: "Gardien",
  eau_permanente: "Eau permanente", balcon: "Balcon",
};

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  villa: "Villa", room: "Chambre", office: "Bureau", shop: "Boutique", land: "Terrain",
};

function formatGNF(amount: number, period?: string | null): string {
  const formatted = new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(amount);
  const base = `${formatted} GNF`;
  return period === "month" ? `${base}/mois` : base;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Property {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    type: row.type,
    transactionType: row.transaction_type,
    status: row.status ?? "active",
    price: row.price,
    pricePeriod: row.price_period ?? "month",
    surface: row.surface,
    rooms: row.rooms,
    bathrooms: row.bathrooms,
    furnished: row.furnished ?? false,
    availableNow: row.available_now ?? true,
    neighborhood: row.neighborhood,
    city: row.city ?? "Conakry",
    features: row.features ?? [],
    images: (row.property_images ?? []).map((img: { id: string; url: string; alt: string; is_primary: boolean }) => ({
      id: img.id, url: img.url, alt: img.alt ?? "", isPrimary: img.is_primary ?? false,
    })),
    owner: {
      id: row.profiles?.id ?? row.owner_id ?? "unknown",
      name: row.profiles?.full_name ?? "Propriétaire",
      email: "",
      phone: row.contact_phone ?? row.profiles?.phone ?? "+224 620 00 00 00",
      whatsapp: row.contact_phone ?? row.profiles?.phone ?? "+224 620 00 00 00",
      role: row.profiles?.role ?? "owner",
      verified: row.profiles?.is_verified ?? false,
      badges: [],
      trustScore: 50,
      totalListings: 1,
      avgRating: 4.5,
      reviewCount: 0,
      createdAt: new Date(row.profiles?.created_at ?? Date.now()),
    },
    badges: [],
    views: row.views ?? 0,
    whatsappClicks: row.whatsapp_clicks ?? 0,
    isBoosted: row.is_boosted ?? false,
    boostExpiresAt: row.boost_expires_at ? new Date(row.boost_expires_at) : undefined,
    createdAt: new Date(row.created_at ?? Date.now()),
    updatedAt: new Date(row.updated_at ?? Date.now()),
  };
}

async function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = await getDB();
  const { data } = await db.from("properties").select("title, description").eq("id", id).single();
  if (!data) return { title: "Annonce introuvable — GuImmo" };
  return {
    title: `${data.title} — GuImmo`,
    description: (data.description ?? "").slice(0, 160),
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const db = await getDB();

  const { data: row, error } = await db
    .from("properties")
    .select("*, property_images(*), profiles(*)")
    .eq("id", id)
    .single();

  if (error || !row) {
    notFound();
  }

  const property = mapRow(row);

  // Increment views — fire and forget
  void db
    .from("properties")
    .update({ views: (row.views ?? 0) + 1 })
    .eq("id", id)
    .then(() => {});

  // Similar: same neighborhood + same type, available, exclude current
  const { data: similarRows } = await db
    .from("properties")
    .select("*, property_images(*)")
    .eq("neighborhood", row.neighborhood)
    .eq("type", row.type)
    .eq("status", "active")
    .neq("id", id)
    .limit(3);

  const similar = (similarRows ?? []).map(mapRow);

  const neighborhoodLabel = getNeighborhoodName(property.neighborhood);
  const phone = property.owner.phone;
  const whatsappPhone = phone.replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Bonjour, je suis intéressé par votre annonce "${property.title}" sur GuImmo`
  );
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`;
  const phoneUrl = `tel:${phone}`;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-32 md:pb-12">
      {/* Back */}
      <div className="flex items-center gap-3 py-4">
        <Link
          href="/annonces"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1e2430] hover:bg-slate-200 dark:hover:bg-[#2a3040] transition-colors text-slate-600 dark:text-slate-300 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <nav className="flex items-center gap-2 text-xs text-slate-400 overflow-hidden">
          <Link href="/" className="hover:text-[#F97316] whitespace-nowrap">Accueil</Link>
          <span>/</span>
          <Link href="/annonces" className="hover:text-[#F97316] whitespace-nowrap">Annonces</Link>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300 truncate">{property.title}</span>
        </nav>
      </div>

      {/* Déjà loué banner */}
      {!property.availableNow && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
              Ce logement est déjà loué.
            </p>
          </div>
          <Link
            href={`/annonces?neighborhood=${property.neighborhood}&type=${property.type}`}
            className="text-red-500 font-bold text-sm whitespace-nowrap hover:underline"
          >
            Voir similaires →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Gallery */}
          <PhotoGallery
            images={property.images.map((i) => ({ url: i.url, alt: i.alt }))}
            title={property.title}
          />

          {/* Availability badge + type */}
          <div className="flex items-center gap-2 flex-wrap">
            {property.availableNow ? (
              <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4" /> Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm px-3 py-1.5 rounded-full">
                <XCircle className="w-4 h-4" /> Déjà loué
              </span>
            )}
            <span className="text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2.5 py-1.5 rounded-full">
              {TYPE_LABELS[property.type] ?? property.type}
            </span>
            <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-full">
              {property.transactionType === "rent" ? "Location" : "Vente"}
            </span>
          </div>

          {/* Title + location + price */}
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {property.title}
            </h1>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mt-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{neighborhoodLabel}, {property.city}</span>
            </div>
            <p className="text-3xl font-black text-[#F97316] mt-3">
              {formatGNF(property.price, property.pricePeriod)}
            </p>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(property.rooms ?? 0) > 0 && (
              <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] text-center">
                <Bed className="w-6 h-6 text-[#F97316] mx-auto mb-1" />
                <p className="font-bold text-slate-900 dark:text-white text-lg">{property.rooms}</p>
                <p className="text-slate-400 text-xs">Chambre{(property.rooms ?? 0) > 1 ? "s" : ""}</p>
              </div>
            )}
            {(property.bathrooms ?? 0) > 0 && (
              <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] text-center">
                <Bath className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="font-bold text-slate-900 dark:text-white text-lg">{property.bathrooms}</p>
                <p className="text-slate-400 text-xs">Salle{(property.bathrooms ?? 0) > 1 ? "s" : ""} de bain</p>
              </div>
            )}
            {(property.surface ?? 0) > 0 && (
              <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] text-center">
                <Square className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="font-bold text-slate-900 dark:text-white text-lg">{property.surface}</p>
                <p className="text-slate-400 text-xs">m²</p>
              </div>
            )}
            <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-4 border border-slate-100 dark:border-[#2a3040] text-center">
              <span className="text-2xl block mb-1">{property.furnished ? "🛋️" : "🪑"}</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {property.furnished ? "Meublé" : "Non meublé"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3">Description</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {property.description}
            </p>

            {property.features.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#2a3040]">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f: string) => (
                    <span
                      key={f}
                      className="bg-slate-50 dark:bg-[#151922] text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-100 dark:border-[#2a3040]"
                    >
                      {FEATURE_LABELS[f] ?? f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA — visible on mobile inline, hidden on desktop (handled in sidebar) */}
          <div className="lg:hidden space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#22c55e] active:scale-95 text-white font-bold py-4 px-6 rounded-2xl transition-all text-base shadow-[0_8px_32px_rgba(37,211,102,0.35)]"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              💬 Contacter sur WhatsApp
            </a>
            <a
              href={phoneUrl}
              className="flex items-center justify-center gap-2 w-full bg-white dark:bg-[#1e2430] hover:bg-slate-50 dark:hover:bg-[#2a3040] text-slate-700 dark:text-white font-semibold py-3.5 px-6 rounded-2xl transition-colors border border-slate-200 dark:border-[#2a3040] text-sm"
            >
              <Phone className="w-4 h-4" />
              📞 Appeler le propriétaire
            </a>
            <p className="text-slate-400 text-xs text-center">
              Mentionnez GuImmo lors de votre contact
            </p>
          </div>

          {/* Similar listings */}
          {similar.length > 0 && (
            <div className="pt-4">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">
                Annonces similaires à {neighborhoodLabel}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {similar.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-20 bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] space-y-3">
            <div className="text-center pb-3 border-b border-slate-100 dark:border-[#2a3040]">
              <p className="text-3xl font-black text-[#F97316]">
                {formatGNF(property.price, property.pricePeriod)}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {neighborhoodLabel} · {TYPE_LABELS[property.type] ?? property.type}
              </p>
            </div>

            <button style={{ background: "red", color: "white", padding: "10px", width: "100%", borderRadius: 8 }}>
              TEST MESSAGE BUTTON
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#22c55e] active:scale-95 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-[0_8px_32px_rgba(37,211,102,0.35)]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              💬 Contacter sur WhatsApp
            </a>

            <a
              href={phoneUrl}
              className="flex items-center justify-center gap-2 w-full bg-slate-50 dark:bg-[#151922] hover:bg-slate-100 dark:hover:bg-[#111418] text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl transition-colors border border-slate-200 dark:border-[#2a3040] text-sm"
            >
              <Phone className="w-4 h-4" />
              📞 Appeler le propriétaire
            </a>

            <MessageButton
              propertyId={property.id}
              ownerId={property.owner.id}
              propertyTitle={property.title}
            />

            <p className="text-slate-400 text-[11px] text-center">
              Mentionnez GuImmo lors de votre contact
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-[#2a3040]">
              <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                🔒 Ne payez jamais avant de visiter le logement. GuImmo ne demande aucun paiement direct.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 px-4 py-3 bg-white/95 dark:bg-[#111418]/95 backdrop-blur border-t border-slate-100 dark:border-[#2a3040]">
        <div className="flex gap-3">
          <a
            href={phoneUrl}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#1e2430] text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-sm"
          >
            <Phone className="w-4 h-4" />
            Appeler
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white font-bold py-3.5 rounded-xl text-sm shadow-[0_4px_20px_rgba(37,211,102,0.35)]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <MessageButton
            propertyId={property.id}
            ownerId={property.owner.id}
            propertyTitle={property.title}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#1e2430] text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-sm"
          />
        </div>
      </div>
    </div>
  );
}
