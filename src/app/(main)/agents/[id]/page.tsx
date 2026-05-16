import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle, MapPin, Phone, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

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
  const { id } = await params;
  const db = getDB();
  const { data } = await db.from("profiles").select("full_name, bio").eq("id", id).single();
  if (!data) return { title: "Agent | BienLoger" };
  return {
    title: `${data.full_name ?? "Agent"} — Agent immobilier | BienLoger`,
    description: data.bio ?? `Agent immobilier sur BienLoger Guinée`,
  };
}

export default async function AgentProfilePage({ params }: Props) {
  const { id } = await params;
  const db = getDB();

  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name, phone, bio, avatar_url, is_verified, is_verified_pro, account_type, role, website, agency_name")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Only show this page for agents
  const isAgent = profile.account_type === "agent" || profile.role === "agent";
  if (!isAgent) notFound();

  const { data: listings } = await db
    .from("properties")
    .select("id, title, neighborhood, price, price_period, available_now, property_images(url, is_primary, sort_order)")
    .eq("owner_id", id)
    .eq("available_now", true)
    .order("created_at", { ascending: false })
    .limit(12);

  const displayName = profile.full_name ?? "Agent";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const waNumber = profile.phone?.replace(/\D/g, "") ?? "";
  const waMsg = `Bonjour ${displayName}, j'aimerais vous contacter via BienLoger.`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      {/* ── Hero ── */}
      <div className="flex items-start gap-5 mb-8">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={displayName} width={80} height={80} className="rounded-2xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0" style={{ background: "rgba(200,144,30,0.20)", border: "1px solid rgba(200,144,30,0.30)" }}>
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-white">{displayName}</h1>
            {profile.is_verified_pro && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(200,144,30,0.15)", color: "#daa84a", border: "1px solid rgba(200,144,30,0.25)" }}>
                <CheckCircle className="w-3 h-3" /> Vérifié Pro
              </span>
            )}
            {profile.is_verified && !profile.is_verified_pro && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.20)" }}>
                <CheckCircle className="w-3 h-3" /> Vérifié
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm mt-0.5">👔 Agent immobilier</p>
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#c8901e] text-xs hover:underline mt-1 inline-block">{profile.website}</a>
          )}
        </div>
      </div>

      {/* ── Bio ── */}
      {profile.bio && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "#1a2e1e", border: "1px solid rgba(240,230,204,0.10)" }}>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">À propos</p>
          <p className="text-white/80 text-sm leading-relaxed">{profile.bio}</p>
        </div>
      )}

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
            Contacter sur WhatsApp
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

      {/* ── Listings ── */}
      <div>
        <h2 className="font-bold text-white text-base mb-4">
          Annonces actives
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
