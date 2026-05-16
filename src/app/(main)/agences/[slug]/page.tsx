import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle, MapPin, Phone, MessageCircle, Building2 } from "lucide-react";
import type { Metadata } from "next";

// slug = profile UUID for agency accounts
interface Props { params: Promise<{ slug: string }> }

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma Centre",
  sonfonia: "Sonfonia", cosa: "Cosa", hamdallaye: "Hamdallaye",
  nongo: "Nongo", taouyah: "Taouyah", koloma: "Koloma",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina",
  kaloum: "Kaloum", matoto: "Matoto Centre", sangoyah: "Sangoyah",
};

function formatGNF(n: number, period?: string | null) {
  const f = new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(n);
  return period === "month" ? `${f} GNF/mois` : `${f} GNF`;
}

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDB();
  const { data } = await db.from("profiles").select("agency_name, full_name, bio").eq("id", slug).single();
  if (!data) return { title: "Agence | BienLoger" };
  const name = data.agency_name ?? data.full_name ?? "Agence";
  return {
    title: `${name} — Agence immobilière | BienLoger`,
    description: data.bio ?? `${name} sur BienLoger Guinée`,
  };
}

export default async function AgenceProfilePage({ params }: Props) {
  const { slug } = await params;
  const db = getDB();

  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name, phone, bio, avatar_url, agency_logo_url, agency_name, is_verified, is_verified_pro, account_type, role, website")
    .eq("id", slug)
    .single();

  if (!profile) notFound();

  const isAgence = profile.account_type === "agence" || profile.role === "agence" || profile.role === "agency";
  if (!isAgence) notFound();

  const { data: listings } = await db
    .from("properties")
    .select("id, title, neighborhood, price, price_period, available_now, property_images(url, is_primary, sort_order)")
    .eq("owner_id", slug)
    .eq("available_now", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const agencyName = profile.agency_name ?? profile.full_name ?? "Agence";
  const initials = agencyName.slice(0, 2).toUpperCase();
  const logoUrl = profile.agency_logo_url ?? profile.avatar_url;
  const waNumber = profile.phone?.replace(/\D/g, "") ?? "";
  const waMsg = `Bonjour ${agencyName}, j'aimerais vous contacter via BienLoger.`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      {/* ── Hero ── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
        <div className="flex items-start gap-5">
          {logoUrl ? (
            <Image src={logoUrl} alt={agencyName} width={80} height={80} className="rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0" style={{ background: "rgba(200,144,30,0.20)", border: "1px solid rgba(200,144,30,0.30)" }}>
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-black text-white">{agencyName}</h1>
              {profile.is_verified_pro && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(200,144,30,0.15)", color: "#daa84a", border: "1px solid rgba(200,144,30,0.25)" }}>
                  <CheckCircle className="w-3 h-3" /> Agence vérifiée
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-white/50 text-sm">
              <Building2 className="w-3.5 h-3.5" />
              Agence immobilière — Guinée
            </div>
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#c8901e] text-xs hover:underline mt-1.5 inline-block">{profile.website}</a>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-white/70 text-sm leading-relaxed mt-4 pt-4" style={{ borderTop: "1px solid rgba(240,230,204,0.08)" }}>{profile.bio}</p>
        )}
      </div>

      {/* ── Contact buttons ── */}
      <div className="flex gap-3 mb-8">
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm transition-opacity hover:opacity-85"
            style={{ background: "#25D366" }}
          >
            <Phone className="w-4 h-4" />
            Contacter l&apos;agence
          </a>
        )}
        <Link
          href="/messages"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-white text-sm transition-colors hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </Link>
      </div>

      {/* ── Stats summary ── */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl p-4" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
          <p className="text-white/40 text-xs font-medium mb-1">Annonces actives</p>
          <p className="text-2xl font-black text-white">{listings?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
          <p className="text-white/40 text-xs font-medium mb-1">Statut</p>
          <p className="text-sm font-bold text-white">{profile.is_verified_pro ? "✓ Pro vérifié" : profile.is_verified ? "✓ Vérifié" : "Agence"}</p>
        </div>
      </div>

      {/* ── Listings ── */}
      <div>
        <h2 className="font-bold text-white text-base mb-4">
          Toutes les annonces
          {listings && listings.length > 0 && (
            <span className="ml-2 text-sm font-semibold text-white/40">({listings.length})</span>
          )}
        </h2>

        {!listings || listings.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-2xl">
            <p className="text-white/40 text-sm">Aucune annonce disponible pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.map((listing) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const imgs: any[] = (listing as any).property_images ?? [];
              const primary = imgs.find((i) => i.is_primary) ?? imgs.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0];
              return (
                <Link
                  key={listing.id}
                  href={`/annonces/${listing.id}`}
                  className="rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-transform"
                  style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}
                >
                  <div className="relative h-40 bg-white/5">
                    {primary?.url ? (
                      <Image src={primary.url} alt={listing.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-white text-sm line-clamp-2 mb-1">{listing.title}</p>
                    <div className="flex items-center gap-1 text-white/50 text-xs mb-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {NEIGHBORHOOD_LABELS[listing.neighborhood] ?? listing.neighborhood}
                    </div>
                    <p className="text-[#c8901e] font-bold text-sm">{formatGNF(listing.price, listing.price_period)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
