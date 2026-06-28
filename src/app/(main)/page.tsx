import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronRight, CircleHelp, Flame, Heart, Home, PlusCircle, X } from "lucide-react";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { HeroSearch } from "@/components/home/HeroSearch";
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

function isValidImageUrl(url?: string | null): url is string {
  if (!url) return false;
  const value = url.trim();
  if (!value || value === "null" || value === "undefined") return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
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
  } catch {
    return [];
  }
}

function DiscoverPreview({ property }: { property: Property | undefined }) {
  const safeImages = (property?.property_images ?? []).filter((image) => isValidImageUrl(image.url));
  const primaryImg = safeImages.find((i) => i.is_primary) ?? safeImages[0];
  const [gradFrom, gradTo] = TYPE_GRADIENTS[property?.type ?? "apartment"] ?? HERO_GRADIENTS[0];

  return (
    <section className="py-4 md:py-7" style={{ background: "var(--bg-card-light)" }}>
      <div className="content-fluid max-w-[1240px]">
        <Link
          href="/decouvrir"
          className="group premium-card relative mx-auto block w-full max-w-[760px] overflow-hidden no-underline"
          style={{
            minHeight: "clamp(360px, 76vw, 520px)",
            background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
          }}
        >
          {primaryImg ? (
            <Image
              src={primaryImg.url}
              alt={property?.title ?? "Découvrir les logements"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 94vw, 760px"
              quality={78}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Home className="h-24 w-24" strokeWidth={1.6} />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.10) 38%, rgba(0,0,0,0.88) 100%)" }} />

          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-white" style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(12px)" }}>
              <Heart className="h-4 w-4" strokeWidth={2.4} />
              Découvre les logements
            </span>
            <span className="app-button-secondary inline-flex min-h-10 items-center justify-center px-4 text-sm font-black" style={{ background: "rgba(255,255,255,0.92)", color: "#17120a" }}>
              Commencer
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="mb-2 text-[28px] font-black leading-tight text-white md:text-[42px]">Fais défiler les annonces</p>
            <p className="mb-4 max-w-[360px] text-base font-bold text-white/88">Comme sur Tinder. Choisis vite, contacte direct.</p>
            <div className="flex items-center gap-2">
              <span className="app-touch inline-flex items-center gap-2 px-4 text-sm font-black text-white" style={{ background: "rgba(185,28,28,0.82)" }}>
                <X className="h-5 w-5" strokeWidth={2.5} />
                Passer
              </span>
              <span className="app-touch inline-flex items-center gap-2 px-4 text-sm font-black" style={{ background: "rgba(255,255,255,0.92)", color: "#17120a" }}>
                <Heart className="h-5 w-5" strokeWidth={2.5} />
                J&apos;aime
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-5 top-1/2 hidden -translate-y-1/2 justify-between sm:flex">
            <span className="app-touch inline-flex rotate-[-8deg] items-center gap-2 px-4 text-base font-black text-white" style={{ background: "rgba(185,28,28,0.70)" }}>
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              Passer
            </span>
            <span className="app-touch inline-flex rotate-[8deg] items-center gap-2 px-4 text-base font-black" style={{ background: "rgba(255,255,255,0.90)", color: "#17120a" }}>
              J&apos;aime
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </span>
          </div>
        </Link>
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
      <section className="hero-section relative overflow-hidden py-3 sm:py-5 lg:py-6">
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
          <div className="mx-auto max-w-[860px] text-center">
            <h1
              className="mx-auto mb-2 max-w-[820px] text-[clamp(2.55rem,11vw,4.7rem)] font-black leading-[0.92]"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-manrope), sans-serif", letterSpacing: 0 }}
            >
              <span className="inline-flex items-center justify-center gap-2.5 md:gap-4">
                <Home className="h-9 w-9 md:h-14 md:w-14" strokeWidth={2.6} style={{ color: "var(--accent-gold)" }} />
                Trouve ton logement
              </span>
            </h1>
            <p className="mx-auto mb-4 max-w-[560px] text-[18px] md:text-xl font-black leading-snug" style={{ color: "var(--text-secondary)" }}>
              Simple. Rapide. Sans démarcheur.
            </p>

            <HeroSearch />

            <div
              className="app-card mx-auto mt-4 max-w-[760px] p-4 text-left sm:flex sm:items-center sm:justify-between sm:gap-4"
              style={{
                background: "linear-gradient(135deg, rgba(185,138,46,0.16), var(--bg-card))",
              }}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: "rgba(185,138,46,0.18)", color: "var(--accent-gold)" }}>
                  <CircleHelp className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-lg font-black leading-tight" style={{ color: "var(--text-primary)" }}>Tu ne trouves pas ton logement ?</p>
                  <p className="mt-1 text-sm font-bold leading-snug" style={{ color: "var(--text-secondary)" }}>
                    Publie gratuitement ta recherche. Les propriétaires pourront te contacter directement.
                  </p>
                </div>
              </div>
              <Link
                href="/je-cherche"
                className="app-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 px-5 text-base font-black no-underline sm:mt-0 sm:w-auto sm:flex-shrink-0"
                style={{ background: "var(--accent-gold)", color: "var(--bg-primary)" }}
              >
                <PlusCircle className="h-5 w-5" strokeWidth={2.5} />
                Publier ma recherche
              </Link>
            </div>
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
                <PropertyCard key={p.id} property={p} index={i + 10} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
