import Link from "next/link";
import { getPropertyById, MOCK_PROPERTIES } from "@/data/mock-properties";
import { formatPrice, getWhatsAppUrl, getWhatsAppMessage, timeAgo } from "@/lib/utils";
import { getNeighborhoodName } from "@/data/neighborhoods";
import { TrustBadge } from "@/components/ui/Badge";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { ShareButton } from "@/components/ui/ShareButton";
import { ReportButton } from "@/components/ui/ReportButton";
import { PropertyActionButtons } from "@/components/property/PropertyActionButtons";
import { StarRating } from "@/components/ui/StarRating";
import { PriceHistoryChart } from "@/components/property/PriceHistoryChart";
import { AvailabilityCalendar } from "@/components/property/AvailabilityCalendar";
import { UserPropertyDetail } from "@/components/property/UserPropertyDetail";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyDetailMapSection } from "@/components/map/PropertyDetailMapSection";
import { PropertyQRCode } from "@/components/ui/PropertyQRCode";
import type { Metadata } from "next";
import { PropertyTimeline } from "@/components/property/PropertyTimeline";
import { PrintButton } from "@/components/ui/PrintButton";
import {
  MapPin, Bed, Bath, Square, Eye, Calendar, CheckCircle,
  Shield, Phone, Wifi, Zap, Car, Sun, Droplets, Play, ArrowLeft
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = getPropertyById(id);
  if (!property) return { title: "Annonce introuvable" };
  return {
    title: property.title,
    description: property.description.slice(0, 160),
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 160),
      images: property.images[0]?.url ? [property.images[0].url] : [],
    },
  };
}

export async function generateStaticParams() {
  return MOCK_PROPERTIES.map((p) => ({ id: p.id }));
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  villa: "Villa", room: "Chambre", office: "Bureau", shop: "Boutique", land: "Terrain",
};

const FEATURE_ICONS: Record<string, typeof Wifi> = {
  "WiFi": Wifi, "Groupe électrogène": Zap, "Parking": Car,
  "Énergie solaire": Sun, "Eau permanente": Droplets, "Forage": Droplets,
};

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = getPropertyById(id);

  // User-published properties are stored in client-side Zustand store
  if (!property) {
    return <UserPropertyDetail id={id} />;
  }

  const whatsappUrl = getWhatsAppUrl(
    property.owner.whatsapp ?? property.owner.phone,
    getWhatsAppMessage(property.title, property.id)
  );
  const phoneUrl = `tel:${property.owner.phone}`;
  const neighborhoodLabel = getNeighborhoodName(property.neighborhood);
  const similar = MOCK_PROPERTIES.filter((p) => p.id !== property.id && p.neighborhood === property.neighborhood).slice(0, 3);

  // Same-owner listings (max 3, exclude current)
  const ownerListings = MOCK_PROPERTIES.filter(
    (p) => p.id !== property.id && p.owner.id === property.owner.id
  ).slice(0, 3);

  // Price per m²
  const pricePerM2 = property.surface
    ? Math.round(property.price / property.surface)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-32 md:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          "name": property.title,
          "description": property.description,
          "url": `https://guimmo.gn/annonces/${property.id}`,
          "price": property.price,
          "priceCurrency": "GNF",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": property.city,
            "addressRegion": property.neighborhood,
            "addressCountry": "GN"
          }
        })}}
      />
      <style>{`
        @media print {
          header, footer, nav, .print\\:hidden { display: none !important; }
          .sticky { position: static !important; }
          body { background: white !important; color: black !important; }
          .bg-\\[\\#111418\\] { background: white !important; }
          .dark\\:bg-\\[\\#1e2430\\] { background: white !important; }
          .dark\\:text-white { color: black !important; }
          .dark\\:text-slate-300 { color: #333 !important; }
          .dark\\:border-\\[\\#2a3040\\] { border-color: #ddd !important; }
        }
      `}</style>
      {/* Back button + Breadcrumb */}
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
          <span className="text-slate-600 dark:text-slate-300 line-clamp-1">{property.title}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery — replaced PropertyDetailClient with PropertyGallery */}
          <PropertyGallery images={property.images} />

          {/* Info */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[property.type]}
                  </span>
                  <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    {property.transactionType === "rent" ? "Location" : "Vente"}
                  </span>
                  {property.availableNow && (
                    <span className="text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Disponible
                    </span>
                  )}
                </div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-2 leading-tight">
                  {property.title}
                </h1>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mt-1">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{neighborhoodLabel}, {property.city}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-[#F97316]">{formatPrice(property.price)}</p>
                {property.pricePeriod === "month" && (
                  <p className="text-slate-400 text-xs">/mois</p>
                )}
                {/* Price per m² tag */}
                {pricePerM2 && (
                  <p className="text-xs text-slate-400 mt-1">
                    ~{formatPrice(pricePerM2)}/m²
                  </p>
                )}
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-[#2a3040]">
              {property.rooms && (
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Bed className="w-5 h-5 text-[#F97316]" />
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">{property.rooms}</p>
                  <p className="text-slate-400 text-xs">Chambre{property.rooms > 1 ? "s" : ""}</p>
                </div>
              )}
              {property.bathrooms && (
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Bath className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">{property.bathrooms}</p>
                  <p className="text-slate-400 text-xs">Salle{property.bathrooms > 1 ? "s" : ""} de bain</p>
                </div>
              )}
              {property.surface && (
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Square className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">{property.surface}</p>
                  <p className="text-slate-400 text-xs">m²</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3">Description</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">{property.description}</p>

            {/* Features */}
            {property.features.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#2a3040]">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Équipements & services</h3>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f) => {
                    const Icon = FEATURE_ICONS[f] ?? CheckCircle;
                    return (
                      <span key={f} className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#151922] text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg">
                        <Icon className="w-3.5 h-3.5 text-[#F97316]" />
                        {f}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Neighborhood map */}
          <PropertyDetailMapSection neighborhood={property.neighborhood} />

          {/* Price history */}
          <PriceHistoryChart price={property.price} transactionType={property.transactionType} />

          {/* Availability calendar */}
          <AvailabilityCalendar availableNow={property.availableNow} />

          {/* Video section */}
          {(property as { videoUrl?: string }).videoUrl && (
            <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Play className="w-4 h-4 text-[#F97316]" /> Vidéo de présentation
              </h2>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                <iframe
                  src={(property as { videoUrl?: string }).videoUrl}
                  title="Visite vidéo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Trust badges */}
          {property.badges.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-5 border border-green-100 dark:border-green-900/30">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="font-bold text-green-800 dark:text-green-300">Garanties GuImmo Safe</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {property.badges.map((b) => (
                  <TrustBadge key={b.id} badge={b} size="md" />
                ))}
              </div>
              <p className="text-green-700 dark:text-green-400 text-xs mt-3">
                Cette annonce a été vérifiée par notre équipe. Vous pouvez visiter en toute confiance.
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.views} vues</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Publié {timeAgo(property.createdAt)}</span>
            <ShareButton title={property.title} />
            <ReportButton propertyId={property.id} />
            <PrintButton />
          </div>

          {/* QR Code réel */}
          <PropertyQRCode
            url={`https://guimmo-orcin.vercel.app/annonces/${property.id}`}
            title={property.title}
          />

          {/* Property Timeline */}
          <PropertyTimeline price={property.price} createdAt={property.createdAt} availableNow={property.availableNow} />

          {/* Same-owner listings */}
          {ownerListings.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">
                Autres annonces de {property.owner.name}
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible scrollbar-none">
                {ownerListings.map((p) => (
                  <div key={p.id} className="min-w-[260px] md:min-w-0">
                    <PropertyCard property={p} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar */}
          {similar.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">Annonces similaires à {neighborhoodLabel}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {similar.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Owner card */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] sticky top-20">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Contacter l&apos;annonceur</h2>

            {/* Owner info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F97316] to-[#EA6C0A] rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {property.owner.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{property.owner.name}</p>
                <p className="text-slate-400 text-xs capitalize">{property.owner.role === "agent" ? "Agent immobilier" : property.owner.role === "agency" ? "Agence" : "Propriétaire"}</p>
                {property.owner.avgRating ? (
                  <StarRating rating={property.owner.avgRating} count={property.owner.reviewCount} size="sm" />
                ) : null}
                {property.owner.responseRate && (
                  <p className="text-green-500 text-xs font-medium">{property.owner.responseRate}% de réponse</p>
                )}
              </div>
            </div>

            {/* Owner badges */}
            {property.owner.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {property.owner.badges.map((b) => <TrustBadge key={b.id} badge={b} size="sm" />)}
              </div>
            )}

            {/* CTA buttons */}
            <div className="space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#22c55e] active:scale-95 text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm shadow-[0_4px_20px_rgba(37,211,102,0.3)]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Contacter sur WhatsApp
              </a>
              <a
                href={phoneUrl}
                className="flex items-center justify-center gap-2 w-full bg-slate-50 dark:bg-[#151922] hover:bg-slate-100 dark:hover:bg-[#111418] active:scale-95 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl transition-all text-sm border border-slate-200 dark:border-[#2a3040]"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{property.owner.phone}</span>
              </a>
            </div>

            <p className="text-slate-400 text-[11px] text-center mt-3">
              Mentionnez GuImmo lors de votre appel
            </p>

            {/* Visit booking buttons */}
            <div className="space-y-2 mt-3">
              <PropertyActionButtons property={property} />
            </div>

            {/* Trust message */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#2a3040]">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                  Ne payez jamais avant de visiter le logement. GuImmo ne demande aucun paiement direct.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 p-4 bg-white/95 dark:bg-[#111418]/95 backdrop-blur border-t border-slate-100 dark:border-[#2a3040]">
        <div className="flex gap-3 mb-2">
          <a href={phoneUrl} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#1e2430] text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-sm">
            <Phone className="w-4 h-4" />
            Appeler
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-sm shadow-[0_4px_20px_rgba(37,211,102,0.35)]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
        </div>
        <PropertyActionButtons property={property} />
      </div>
    </div>
  );
}
