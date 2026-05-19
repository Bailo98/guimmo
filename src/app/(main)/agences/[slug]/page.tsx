import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle, MapPin, Phone, MessageCircle, Building2 } from "lucide-react";
import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils";

// slug = profile UUID for agency accounts
interface Props { params: Promise<{ slug: string }> }

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma Centre",
  sonfonia: "Sonfonia", cosa: "Cosa", hamdallaye: "Hamdallaye",
  nongo: "Nongo", taouyah: "Taouyah", koloma: "Koloma",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina",
  kaloum: "Kaloum", matoto: "Matoto Centre", sangoyah: "Sangoyah",
};

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
  if (!data) return { title: "Agence | LogerBien" };
  const name = data.agency_name ?? data.full_name ?? "Agence";
  return {
    title: `${name} — Agence immobilière | LogerBien`,
    description: data.bio ?? `${name} sur LogerBien Guinée`,
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
  const waMsg = `Bonjour ${agencyName}, j'aimerais vous contacter via LogerBien.`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      {/* ── Hero ── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border-md)" }}>
        <div className="flex items-start gap-5">
          {logoUrl ? (
            <Image src={logoUrl} alt={agencyName} width={80} height={80} className="rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ background: "rgba(200,144,30,0.20)", border: "1px solid rgba(200,144,30,0.30)", color: "var(--bl-amber-light)" }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-black" style={{ color: "var(--bl-cream)", fontFamily: "var(--font-display), sans-serif" }}>{agencyName}</h1>
              {profile.is_verified_pro && (
                <span className="bl-badge-pro flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Agence vérifiée
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--bl-cream-faint)" }}>
              <Building2 className="w-3.5 h-3.5" />
              Agence immobilière — Guinée
            </div>
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="text-xs hover:underline mt-1.5 inline-block" style={{ color: "var(--bl-amber)" }}>
                {profile.website}
              </a>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--bl-border)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--bl-cream-dim)" }}>{profile.bio}</p>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bl-stat-card">
          <span className="bl-stat-label">Annonces actives</span>
          <span className="bl-stat-value">{listings?.length ?? 0}</span>
        </div>
        <div className="bl-stat-card">
          <span className="bl-stat-label">Statut</span>
          <span className="bl-stat-value" style={{ fontSize: 14 }}>
            {profile.is_verified_pro ? "Pro ✓" : profile.is_verified ? "Vérifié ✓" : "Agence"}
          </span>
        </div>
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
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm transition-opacity hover:opacity-75"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid var(--bl-border-md)", color: "var(--bl-cream)" }}
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </Link>
      </div>

      {/* ── Listings ── */}
      <div>
        <h2 className="bl-section-title mb-4">
          Toutes les annonces
          {listings && listings.length > 0 && (
            <span className="ml-2 text-sm font-semibold" style={{ color: "var(--bl-cream-faint)" }}>({listings.length})</span>
          )}
        </h2>

        {!listings || listings.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-2xl" style={{ borderColor: "var(--bl-border-md)" }}>
            <p className="text-sm" style={{ color: "var(--bl-cream-faint)" }}>Aucune annonce disponible pour l&apos;instant.</p>
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
                  style={{ background: "var(--bl-surface)", border: "1px solid var(--bl-border)" }}
                >
                  <div className="relative h-40" style={{ background: "rgba(255,255,255,0.04)" }}>
                    {primary?.url ? (
                      <Image src={primary.url} alt={listing.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm line-clamp-2 mb-1" style={{ color: "var(--bl-cream)" }}>{listing.title}</p>
                    <div className="flex items-center gap-1 text-xs mb-2" style={{ color: "var(--bl-cream-faint)" }}>
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {NEIGHBORHOOD_LABELS[listing.neighborhood] ?? listing.neighborhood}
                    </div>
                    <p className="font-bold text-sm" style={{ color: "var(--bl-amber)" }}>{formatPrice(listing.price, "GNF", listing.price_period)}</p>
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
