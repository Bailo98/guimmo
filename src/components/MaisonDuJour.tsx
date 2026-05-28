import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { formatPrice } from "@/lib/utils";
import { getNeighborhoodName } from "@/data/neighborhoods";
import type { Property } from "@/types";

async function fetchMaisonDuJour(): Promise<(Property & { fav_count: number }) | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const db = createClient(url, key);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate favorites created today, grouped by property_id
    const { data: favData, error: favError } = await db
      .from("favorites")
      .select("property_id")
      .gte("created_at", today.toISOString());

    if (favError || !favData || favData.length === 0) return null;

    // Count favorites per property
    const counts: Record<string, number> = {};
    for (const row of favData) {
      counts[row.property_id] = (counts[row.property_id] ?? 0) + 1;
    }
    const sortedIds = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sortedIds.length) return null;

    const [topId, topCount] = sortedIds[0];

    const { data: prop } = await db
      .from("properties")
      .select("*, property_images(*)")
      .eq("id", topId)
      .eq("status", "active")
      .single();

    if (!prop) return null;
    return { ...(prop as Property), fav_count: topCount };
  } catch {
    return null;
  }
}

export async function MaisonDuJour() {
  const property = await fetchMaisonDuJour();
  if (!property) return null;

  const primaryImg =
    (property.property_images ?? []).find((i) => i.is_primary) ??
    (property.property_images ?? [])[0];
  const neighborhoodLabel = getNeighborhoodName(property.neighborhood);
  const priceStr = formatPrice(property.price, "GNF", property.price_period);
  const waMsg = encodeURIComponent(
    `Bonjour, je suis intéressé par "${property.title}" sur LogerBien !\nhttps://logerbien.gn/annonces/${property.id}`
  );
  const waUrl = property.contact_phone
    ? `https://wa.me/${property.contact_phone.replace(/\D/g, "")}?text=${waMsg}`
    : `https://wa.me/?text=${waMsg}`;

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-5 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <h2
              className="text-xl md:text-2xl font-black"
              style={{ color: "#ffffff", fontFamily: "var(--font-display), sans-serif" }}
            >
              Maison du jour
            </h2>
            <p className="text-sm" style={{ color: "#666" }}>
              Le bien le plus apprécié aujourd&apos;hui
            </p>
          </div>
        </div>

        <Link href={`/annonces/${property.id}`} className="block group">
          <div
            className="relative overflow-hidden rounded-[20px]"
            style={{
              background: "var(--bg-card-dark)",
              border: "1px solid rgba(200,169,126,0.25)",
              boxShadow: "0 8px 40px rgba(200,169,126,0.12)",
            }}
          >
            {/* Photo */}
            <div className="relative w-full" style={{ height: 280 }}>
              {primaryImg ? (
                <Image
                  src={primaryImg.url}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 1200px"
                  quality={80}
                  priority
                />
              ) : (
                <div className="w-full h-full bg-[#1a252b]" />
              )}
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(transparent 30%, rgba(0,0,0,0.75) 100%)",
                }}
              />
              {/* Badges top-left */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
                  style={{
                    background: "rgba(212,175,55,0.20)",
                    color: "var(--accent-gold)",
                    border: "1px solid rgba(212,175,55,0.40)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  🏆 Maison du jour
                </span>
                {(property.fav_count ?? 0) > 0 && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: "rgba(239,68,68,0.20)",
                      color: "#ff6b6b",
                      border: "1px solid rgba(239,68,68,0.40)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    🔥 {property.fav_count} personne{property.fav_count > 1 ? "s" : ""} intéressée{property.fav_count > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {/* Price + location overlay bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p
                  className="text-3xl font-black mb-1"
                  style={{
                    color: "var(--accent-gold)",
                    fontFamily: "var(--font-playfair), serif",
                    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  {priceStr}
                </p>
                <p className="text-white font-bold text-lg leading-tight">
                  {property.title}
                </p>
                <p className="text-white/70 text-sm mt-0.5">
                  📍 {neighborhoodLabel}, Conakry
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                {(property.rooms ?? 0) > 0 && (
                  <span className="text-sm text-white/60">
                    🛏 {property.rooms} ch.
                  </span>
                )}
                {(property.surface ?? 0) > 0 && (
                  <span className="text-sm text-white/60">
                    📐 {property.surface} m²
                  </span>
                )}
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(233,233,0,0.10)",
                    color: "#E9E900",
                    border: "1px solid rgba(233,233,0,0.20)",
                  }}
                >
                  {property.transaction_type === "rent" ? "Location" : "Vente"}
                </span>
              </div>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{
                  background: "rgba(37,211,102,0.15)",
                  color: "#25D366",
                  border: "1px solid rgba(37,211,102,0.35)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Partager sur WhatsApp
              </a>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
