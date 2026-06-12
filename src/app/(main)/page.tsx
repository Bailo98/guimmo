import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronRight, Flame, Heart, Home, MapPin, MessageCircle, Phone, Search, X } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { HeroSearch } from "@/components/home/HeroSearch";
import { formatPrice } from "@/lib/utils";
import { isPubliclyAvailable } from "@/lib/property-signals";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import type { Property } from "@/types";

// Avoid serving stale HTML/RSC with newer client chunks on Vercel.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "LogerBien - Trouvez votre logement à Conakry",
  description:
    "Trouvez votre logement à Conakry sans commission. Appartements, maisons, villas. Contact direct propriétaire en Guinée.",
  openGraph: {
    title: "LogerBien - Trouvez votre logement à Conakry",
    description: "Trouvez votre logement à Conakry sans commission. Direct propriétaire.",
    url: "https://logerbien.gn",
    siteName: "LogerBien",
  },
};

const NL: Record<string, string> = {
  kipe: "Kipé", hamdallaye: "Hamdallaye", dixinn: "Dixinn", ratoma: "Ratoma",
  taouyah: "Taouyah", sonfonia: "Sonfonia", lambanyi: "Lambanyi", kaloum: "Kaloum",
  matam: "Matam", madina: "Madina", nongo: "Nongo", cosa: "Cosa",
};

const TYPE_GRADIENTS: Record<string, [string, string]> = {
  apartment: ["var(--bg-secondary)", "var(--bg-secondary)"],
  villa: ["var(--bg-secondary)", "var(--bg-primary)"],
  house: ["var(--bg-primary)", "var(--bg-secondary)"],
  studio: ["var(--bg-primary)", "var(--bg-secondary)"],
  room: ["var(--bg-secondary)", "var(--bg-secondary)"],
  land: ["var(--bg-primary)", "var(--bg-secondary)"],
};

const HERO_GRADIENTS: [string, string][] = [
  ["var(--bg-secondary)", "var(--bg-secondary)"],
  ["var(--bg-primary)", "var(--bg-secondary)"],
  ["var(--bg-primary)", "var(--bg-secondary)"],
];

const SHOW_HOME_SECONDARY_SECTIONS = true;

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

function DiscoverPreview({ property }: { property: Property | undefined }) {
  const primaryImg = property?.property_images?.find((i) => i.is_primary) ?? property?.property_images?.[0];
  const [gradFrom, gradTo] = TYPE_GRADIENTS[property?.type ?? "apartment"] ?? HERO_GRADIENTS[0];
  const priceStr = property ? formatPrice(property.price, "GNF", property.price_period) : "Découvre les annonces";
  const neighborhood = property ? NL[property.neighborhood] ?? property.neighborhood : "Conakry";

  return (
    <section className="py-5 md:py-7" style={{ background: "var(--bg-card-light)" }}>
      <div className="content-fluid max-w-[1240px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-[28px] md:text-[40px] font-bold mb-3 leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}>
            <span className="inline-flex items-center justify-center gap-3">
              <Heart className="h-8 w-8 md:h-10 md:w-10" strokeWidth={2.4} />
              Découvre les logements
            </span>
          </h2>
          <div className="hidden">
            <div className="rounded-2xl px-3 py-4 text-center text-base font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#b91c1c" }}>
              <X className="mx-auto mb-1 h-7 w-7" strokeWidth={2.5} />
              Passer
            </div>
            <div className="rounded-2xl px-3 py-4 text-center text-base font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--accent-gold)" }}>
              <Heart className="mx-auto mb-1 h-7 w-7" strokeWidth={2.5} />
              J&apos;aime
            </div>
          </div>
          <Link
            href="/decouvrir"
            className="mb-5 inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-base font-black transition-all hover:-translate-y-0.5 hover:opacity-95"
            style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
          >
            Commencer
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-[600px] py-3">
          <div
            className="absolute left-0 top-[34%] z-30 hidden sm:flex -translate-x-2 -rotate-6 items-center gap-2 rounded-2xl px-4 py-3 text-base font-black"
            style={{ background: "rgba(255,255,255,0.92)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.18)", boxShadow: "0 16px 40px rgba(24,21,16,0.12)" }}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            <X className="h-5 w-5" strokeWidth={2.5} />
            Passer
          </div>
          <div
            className="absolute right-0 top-[34%] z-30 hidden sm:flex translate-x-2 rotate-6 items-center gap-2 rounded-2xl px-4 py-3 text-base font-black"
            style={{ background: "rgba(255,255,255,0.92)", color: "#be8a2e", border: "1px solid rgba(185,138,46,0.22)", boxShadow: "0 16px 40px rgba(24,21,16,0.12)" }}
          >
            <Heart className="h-5 w-5" strokeWidth={2.5} />
            J&apos;aime
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </div>

          <div className="absolute left-9 right-9 top-8 h-[88%] rotate-[-8deg] rounded-[30px]" style={{ background: "rgba(185,138,46,0.18)", border: "1px solid rgba(185,138,46,0.20)" }} />
          <div className="absolute left-9 right-9 top-8 h-[88%] rotate-[8deg] rounded-[30px]" style={{ background: "rgba(31,86,61,0.16)", border: "1px solid rgba(31,86,61,0.18)" }} />

          <Link href={property ? `/annonces/${property.id}` : "/decouvrir"} className="relative z-20 mx-auto block w-full max-w-[360px]">
            <div
              className="relative overflow-hidden rounded-[30px]"
              style={{
                aspectRatio: "0.68",
                background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                boxShadow: "0 22px 70px rgba(24,21,16,0.22)",
              }}
            >
              {primaryImg ? (
                <Image src={primaryImg.url} alt={property?.title ?? "Découvrir les logements"} fill className="object-cover" sizes="360px" quality={75} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <Home className="h-20 w-20" strokeWidth={1.6} />
                </div>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 28%, rgba(0,0,0,0.9) 100%)" }} />
              <div className="absolute left-4 right-4 bottom-4">
                <p className="mb-3 inline-flex rounded-full px-3 py-1 text-base font-black text-white" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  Glisse. Choisis. Contacte.
                </p>
                <p className="text-[32px] font-black leading-tight text-white">{priceStr}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-lg font-black text-white">
                  <MapPin className="h-5 w-5" strokeWidth={2.4} />
                  {neighborhood}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center text-base font-black text-white" style={{ background: "#25D366" }}>
                    <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
                    WhatsApp
                  </span>
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center text-base font-black" style={{ background: "rgba(255,255,255,0.92)", color: "#17120a" }}>
                    <Phone className="h-4 w-4" strokeWidth={2.4} />
                    Appeler
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <span className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-base font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#b91c1c" }}>
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              <X className="h-5 w-5" strokeWidth={2.5} />
              Passer
            </span>
            <span className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-base font-black" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--accent-gold)" }}>
              <Heart className="h-5 w-5" strokeWidth={2.5} />
              J&apos;aime
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const properties = await fetchHomeProperties();

  const discoverPreview = properties[0];
  const recent = properties.slice(0, 4);
  return (
    <>
      <section className="hero-section relative overflow-hidden py-4 sm:py-5 lg:py-6">
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

        <div className="content-fluid max-w-[1240px] relative">
          <div className="mx-auto max-w-[1120px] text-center">
            <h1
              className="mx-auto mb-3 max-w-[820px] text-[clamp(2rem,8vw,3.5rem)] font-bold leading-[0.98]"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-manrope), sans-serif", letterSpacing: 0 }}
            >
              <span className="inline-flex items-center justify-center gap-2 md:gap-3">
                <MapPin className="h-8 w-8 md:h-11 md:w-11" strokeWidth={2.5} />
                Où cherches-tu ?
              </span>
            </h1>
            <p className="mx-auto mb-4 max-w-[560px] text-base md:text-lg font-bold leading-snug" style={{ color: "var(--text-secondary)" }}>
              Sans démarcheur. Sans commission.
            </p>

            <div className="mb-4 grid grid-cols-3 gap-2 max-w-xl mx-auto">
              {[
                { label: "Je cherche", Icon: Search },
                { label: "Je découvre", Icon: Heart },
                { label: "Je contacte", Icon: MessageCircle },
              ].map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-base font-black"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.3} />
                  {label}
                </span>
              ))}
            </div>

            <HeroSearch />
          </div>
        </div>
      </section>

      <DiscoverPreview property={discoverPreview} />

      {SHOW_HOME_SECONDARY_SECTIONS && recent.length > 0 && (
        <section className="py-5 md:py-7" style={{ background: "var(--bg-primary)" }}>
          <div className="content-fluid max-w-[1240px]">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2
                  className="text-[28px] md:text-[40px] font-bold"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display), sans-serif" }}
                >
                  <span className="inline-flex items-center gap-3">
                    <Flame className="h-8 w-8" strokeWidth={2.4} />
                    Annonces récentes
                  </span>
                </h2>
              </div>
              <Link href="/annonces" className="flex items-center gap-1 text-base font-bold hover:underline" style={{ color: "var(--accent-gold)" }}>
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6 items-stretch">
              {recent.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i + 10} />
              ))}
            </div>
          </div>
        </section>
      )}

    </>
  );
}
