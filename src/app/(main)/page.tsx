import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HomePublishCTA } from "@/components/home/HomePublishCTA";
import { formatPrice } from "@/lib/utils";
import { isPubliclyAvailable } from "@/lib/property-signals";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import type { Property } from "@/types";

// Revalidate every 60s for a near-live feel without re-fetching every request
export const revalidate = 60;

export const metadata: Metadata = {
  title: "LogerBien — Trouvez votre logement à Conakry",
  description:
    "Trouvez votre logement à Conakry sans commission. Appartements, maisons, villas. Contact direct propriétaire en Guinée.",
  openGraph: {
    title: "LogerBien — Trouvez votre logement à Conakry",
    description: "Trouvez votre logement à Conakry sans commission. Direct propriétaire.",
    url: "https://logerbien.gn",
    siteName: "LogerBien",
  },
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const NL: Record<string, string> = {
  kipe: "Kipé", hamdallaye: "Hamdallaye", dixinn: "Dixinn", ratoma: "Ratoma",
  taouyah: "Taouyah", sonfonia: "Sonfonia", lambanyi: "Lambanyi", kaloum: "Kaloum",
  matam: "Matam", madina: "Madina", nongo: "Nongo", cosa: "Cosa",
};

const TYPE_GRADIENTS: Record<string, [string, string]> = {
  apartment: ["var(--bg-secondary)", "var(--bg-secondary)"],
  villa:     ["var(--bg-secondary)", "var(--bg-primary)"],
  house:     ["var(--bg-primary)", "var(--bg-secondary)"],
  studio:    ["var(--bg-primary)", "var(--bg-secondary)"],
  room:      ["var(--bg-secondary)", "var(--bg-secondary)"],
  land:      ["var(--bg-primary)", "var(--bg-secondary)"],
};

const HERO_GRADIENTS: [string, string][] = [
  ["var(--bg-secondary)", "var(--bg-secondary)"],
  ["var(--bg-primary)", "var(--bg-secondary)"],
  ["var(--bg-primary)", "var(--bg-secondary)"],
];

// ─── Data fetching ─────────────────────────────────────────────────────────────

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchHomeProperties(): Promise<Property[]> {
  try {
    const db = getDB();
    if (!db) return [];
    const { data } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("status", "active")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);
    return ((data ?? []) as Property[]).filter(isPubliclyAvailable);
  } catch { return []; }
}

// ─── Discover preview ──────────────────────────────────────────────────────────

function DiscoverPreview({ property }: { property: Property | undefined }) {
  const primaryImg = property?.property_images?.find((i) => i.is_primary) ?? property?.property_images?.[0];
  const [gradFrom, gradTo] = TYPE_GRADIENTS[property?.type ?? "apartment"] ?? HERO_GRADIENTS[0];
  const priceStr = property ? formatPrice(property.price, "GNF", property.price_period) : "Découvre les annonces";

  return (
    <section className="py-6 md:py-8" style={{ background: "var(--bg-card-light)" }}>
      <div className="content-fluid grid grid-cols-1 lg:grid-cols-[minmax(0,0.75fr)_minmax(320px,0.7fr)] gap-5 lg:gap-8 items-center">
        <div className="text-center lg:text-left">
          <h2 className="text-[32px] md:text-[46px] font-black mb-3 leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}>
            ❤️ Découvre les logements
          </h2>
          <p className="mb-4 text-lg font-black" style={{ color: "var(--text-secondary)" }}>
            Swipe. Aime. Contacte.
          </p>
          <div className="grid grid-cols-2 gap-2 max-w-md mx-auto lg:mx-0 mb-5">
            {["❌ Passer", "❤️ J’aime", "💬 WhatsApp", "📞 Appeler"].map((label) => (
              <div
                key={label}
                className="rounded-2xl px-3 py-4 text-center text-base font-black"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                {label}
              </div>
            ))}
          </div>
          <Link
            href="/decouvrir"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-base font-black transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
          >
            Commencer
          </Link>
        </div>

        <Link href={property ? `/annonces/${property.id}` : "/decouvrir"} className="mx-auto block w-full max-w-[360px]">
          <div
            className="relative overflow-hidden rounded-[28px]"
            style={{
              aspectRatio: "0.68",
              background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
              boxShadow: "0 22px 70px rgba(24,21,16,0.18)",
            }}
          >
            {primaryImg ? (
              <Image src={primaryImg.url} alt={property?.title ?? "Découvrir les logements"} fill className="object-cover" sizes="330px" quality={75} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-20">🏠</div>
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 28%, rgba(0,0,0,0.88) 100%)" }} />
            <div className="absolute left-4 right-4 bottom-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full px-3 py-1 text-base font-black" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                  {property?.transaction_type === "sale" ? "Achat" : "Location"}
                </span>
                {property?.is_verified && (
                  <span className="rounded-full px-3 py-1 text-base font-black" style={{ background: "rgba(34,197,94,0.2)", color: "#fff" }}>
                    ✓ Vérifié
                  </span>
                )}
              </div>
              <p className="text-[32px] font-black leading-tight text-white">{priceStr}</p>
              <p className="mt-1 text-lg font-black text-white">📍 {property ? NL[property.neighborhood] ?? property.neighborhood : "Conakry"}</p>
              <p className="mt-2 inline-flex rounded-full px-3 py-1 text-base font-black text-white" style={{ background: "rgba(34,197,94,0.24)", border: "1px solid rgba(255,255,255,0.18)" }}>
                🟢 Disponible
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const properties = await fetchHomeProperties();

  const discoverPreview = properties[0];
  const recent      = properties.slice(0, 3);

  return (
    <>
      <section className="hero-section relative overflow-hidden py-5 sm:py-7 lg:py-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            mixBlendMode: "overlay",
          }}
        />

        <div className="content-fluid relative">
          <div className="mx-auto max-w-[900px] text-center">
            <h1
              className="mx-auto mb-3 max-w-[820px] text-[clamp(2.375rem,6vw,3.5rem)] font-black leading-[0.98]"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-manrope), sans-serif", letterSpacing: 0 }}
            >
              📍 Où cherches-tu ?
            </h1>
            <p className="mx-auto mb-4 max-w-[560px] text-base md:text-lg font-bold leading-snug" style={{ color: "var(--text-secondary)" }}>
              Sans démarcheur. Sans commission.
            </p>

            <div className="mb-4 grid grid-cols-3 gap-2 max-w-xl mx-auto">
              {[
                "🔍 Je cherche",
                "❤️ Je découvre",
                "💬 Je contacte",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-2xl px-3 py-3 text-base font-black"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  {label}
                </span>
              ))}
            </div>

            <HeroSearch />
          </div>
        </div>
      </section>

      <DiscoverPreview property={discoverPreview} />

      {recent.length > 0 && (
        <section className="py-7 md:py-9" style={{ background: "var(--bg-primary)" }}>
          <div className="content-fluid">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2
                  className="text-[30px] md:text-[40px] font-black"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
                >
                  🔥 Annonces récentes
                </h2>
              </div>
              <Link href="/annonces" className="flex items-center gap-1 text-base font-bold hover:underline" style={{ color: "var(--accent-gold)" }}>
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5 items-stretch">
              {recent.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i + 10} />
              ))}
            </div>
          </div>
        </section>
      )}

      <HomePublishCTA />
    </>
  );
}
