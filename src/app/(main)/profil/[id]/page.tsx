import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { MapPin, CheckCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils";

interface Props { params: Promise<{ id: string }> }

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma Centre",
  sonfonia: "Sonfonia", cosa: "Cosa", hamdallaye: "Hamdallaye",
  nongo: "Nongo", taouyah: "Taouyah", koloma: "Koloma",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina",
  kaloum: "Kaloum", matoto: "Matoto Centre", sangoyah: "Sangoyah",
};

const ROLE_LABELS: Record<string, string> = {
  proprietaire: "Propriétaire", owner: "Propriétaire",
  agence: "Agence", agent: "Agent",
  chercheur: "Chercheur", buyer: "Chercheur",
  admin: "Admin",
};

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = getDB();
  const { data } = await db.from("profiles").select("full_name, role").eq("id", id).single();
  if (!data) return { title: "Profil introuvable — LogerBien" };
  return { title: `${data.full_name ?? "Utilisateur"} — LogerBien` };
}

export default async function ProfilPage({ params }: Props) {
  const { id } = await params;
  const db = getDB();

  const [{ data: profile }, { data: listings }] = await Promise.all([
    db.from("profiles").select("id, full_name, phone, role, agency_name, avatar_url, is_verified").eq("id", id).single(),
    db.from("properties")
      .select("id, title, neighborhood, price, price_period, available_now, views, property_images(url, is_primary)")
      .eq("owner_id", id)
      .eq("available_now", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!profile) notFound();

  const displayName = profile.full_name ?? "Utilisateur";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;
  const isAgence = profile.role === "agence" || profile.role === "agent";
  const whatsappUrl = profile.phone
    ? `https://wa.me/${profile.phone.replace(/\D/g, "")}`
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedListings = (listings ?? []).map((row: any) => {
    const imgs = row.property_images ?? [];
    const primary = imgs.find((i: any) => i.is_primary) ?? imgs[0];
    return { ...row, primaryImage: primary?.url ?? null };
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      {/* Profile card */}
      <div className="bg-[#2c2f36] rounded-3xl border border-[#1e2a30] p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-[#E9E900] flex-shrink-0 flex items-center justify-center text-white text-2xl font-black overflow-hidden">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={displayName} width={80} height={80} className="object-cover w-full h-full" />
          ) : (
            initials || "?"
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{displayName}</h1>
            {profile.is_verified && (
              <CheckCircle className="w-5 h-5 text-[#E9E900] flex-shrink-0" />
            )}
          </div>
          {isAgence && profile.agency_name && (
            <p className="text-[#E9E900] font-semibold text-sm mt-0.5">{profile.agency_name}</p>
          )}
          <span className="inline-block mt-1 text-xs font-bold bg-slate-100 dark:bg-[#2a3040] text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
            {roleLabel}
          </span>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {mappedListings.length} annonce{mappedListings.length !== 1 ? "s" : ""} active{mappedListings.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Contact */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#c4c400] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0"
          >
            <Phone className="w-4 h-4" />
            WhatsApp
          </a>
        )}
      </div>

      {/* Listings */}
      {mappedListings.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Annonces de {displayName.split(" ")[0]}
          </h2>
          <div className="space-y-3">
            {mappedListings.map((l) => (
              <Link
                key={l.id}
                href={`/annonces/${l.id}`}
                className="flex gap-3 bg-[#2c2f36] rounded-2xl border border-[#1e2a30] p-3 hover:border-[#E9E900]/40 transition-colors"
              >
                <div className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#151922]">
                  {l.primaryImage ? (
                    <Image src={l.primaryImage} alt={l.title} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">{l.title}</p>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {NEIGHBORHOOD_LABELS[l.neighborhood] ?? l.neighborhood}
                  </div>
                  <p className="text-[#E9E900] font-bold text-sm mt-1">
                    {formatPrice(l.price, "GNF", l.price_period)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {mappedListings.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏠</p>
          <p className="font-medium">Aucune annonce active pour le moment.</p>
        </div>
      )}
    </div>
  );
}
