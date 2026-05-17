"use client";
import { useAppStore } from "@/lib/store";
import { formatPrice, getWhatsAppUrl, getWhatsAppMessage, timeAgo } from "@/lib/utils";
import { MapPin, Bed, Bath, Square, Phone, Eye, Calendar, Shield, QrCode, Video, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { PropertyGallery } from "@/components/property/PropertyGallery";

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  villa: "Villa", room: "Chambre", office: "Bureau", shop: "Boutique", land: "Terrain",
};

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  kipe: "Kipé", lambanyi: "Lambanyi", ratoma: "Ratoma", sonfonia: "Sonfonia",
  cosa: "Cosa", hamdallaye: "Hamdallaye", nongo: "Nongo", taouyah: "Taouyah",
  dixinn: "Dixinn", matam: "Matam", madina: "Madina", kaloum: "Kaloum",
};

export function UserPropertyDetail({ id }: { id: string }) {
  const publishedListings = useAppStore((s) => s.publishedListings);
  const property = publishedListings.find((p) => p.id === id);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitName, setVisitName] = useState("");
  const [visitPhone, setVisitPhone] = useState("");
  const [visitSent, setVisitSent] = useState(false);

  if (!property) notFound();

  const neighborhoodLabel = NEIGHBORHOOD_LABELS[property.neighborhood] ?? property.neighborhood;
  const primaryImage = property.images.find((i) => i.isPrimary) ?? property.images[0];
  const whatsappUrl = getWhatsAppUrl(
    property.owner.whatsapp ?? property.owner.phone,
    getWhatsAppMessage(property.title, property.id)
  );
  const phoneUrl = `tel:${property.owner.phone}`;
  const pricePerM2 = property.surface ? Math.round(property.price / property.surface) : null;

  function handleVisitSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVisitSent(true);
    setTimeout(() => { setShowVisitModal(false); setVisitSent(false); }, 2000);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-32 md:pb-12">
      <nav className="flex items-center gap-2 text-xs text-slate-400 py-4">
        <Link href="/" className="hover:text-[#E9E900]">Accueil</Link>
        <span>/</span>
        <Link href="/annonces" className="hover:text-[#E9E900]">Annonces</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 line-clamp-1">{property.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          {property.images.length > 0 ? (
            <PropertyGallery
              images={property.images.map((img, i) => ({
                id: img.id ?? String(i),
                url: img.url,
                alt: img.alt,
                isPrimary: img.isPrimary,
              }))}
            />
          ) : (
            <div className="aspect-[16/9] bg-slate-100 dark:bg-[#1e2430] rounded-2xl flex items-center justify-center">
              <Square className="w-12 h-12 text-slate-300" />
            </div>
          )}

          {/* Info card */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[property.type] ?? property.type}
                  </span>
                  <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    {property.transactionType === "rent" ? "Location" : "Vente"}
                  </span>
                  {property.availableNow && (
                    <span className="text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
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
                <p className="text-2xl font-black text-[#E9E900]">{formatPrice(property.price)}</p>
                {property.pricePeriod === "month" && <p className="text-slate-400 text-xs">/mois</p>}
                {pricePerM2 && <p className="text-xs text-slate-400 mt-0.5">~{formatPrice(pricePerM2)}/m²</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-[#2a3040]">
              {property.rooms && (
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <Bed className="w-5 h-5 text-[#E9E900]" />
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
          {property.description && (
            <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
              <h2 className="font-bold text-slate-900 dark:text-white mb-3">Description</h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
              <h2 className="font-bold text-slate-900 dark:text-white mb-3">Équipements</h2>
              <div className="flex flex-wrap gap-2">
                {property.features.map((f) => (
                  <span key={f} className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visite virtuelle placeholder */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#E9E900]" /> Visite virtuelle
            </h2>
            <div className="aspect-video bg-slate-100 dark:bg-[#151922] rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400">
              <Video className="w-10 h-10" />
              <p className="text-sm font-medium">Visite virtuelle disponible sur demande</p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#E9E900] hover:underline"
              >
                Contacter pour accès →
              </a>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#E9E900]" /> QR Code de l&apos;annonce
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-[#151922] rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                <QrCode className="w-10 h-10 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Partagez cette annonce</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Scannez pour accéder directement à cette annonce depuis un autre appareil.</p>
                <button
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="text-xs text-[#E9E900] hover:underline mt-1"
                >
                  Copier le lien
                </button>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.views} vues</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Publié {timeAgo(new Date(property.createdAt))}</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] sticky top-20 space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Contacter l&apos;annonceur</h2>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E9E900] to-[#c4c400] rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {property.owner.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{property.owner.name}</p>
                <p className="text-slate-400 text-xs">Propriétaire</p>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#c4c400] text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm"
            >
              WhatsApp
            </a>
            <a
              href={phoneUrl}
              className="flex items-center justify-center gap-2 w-full bg-slate-50 dark:bg-[#151922] text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-200 dark:border-[#2a3040] transition-all text-sm"
            >
              <Phone className="w-4 h-4" />
              {property.owner.phone}
            </a>

            {/* Réserver une visite */}
            <button
              onClick={() => setShowVisitModal(true)}
              className="flex items-center justify-center gap-2 w-full bg-[#E9E900]/10 hover:bg-[#c4c400]/20 text-[#E9E900] font-semibold py-3 px-4 rounded-xl border border-[#E9E900]/30 transition-all text-sm"
            >
              <Calendar className="w-4 h-4" /> Réserver une visite
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-[#2a3040]">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-400 text-xs leading-relaxed">
                  Ne payez jamais avant de visiter le logement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 p-4 bg-white/95 dark:bg-[#111418]/95 backdrop-blur border-t border-slate-100 dark:border-[#2a3040]">
        <div className="flex gap-3">
          <a href={phoneUrl} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#1e2430] text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-sm">
            <Phone className="w-4 h-4" /> Appeler
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-sm">
            WhatsApp
          </a>
        </div>
      </div>

      {/* Visit booking modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => setShowVisitModal(false)}>
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E9E900]" /> Réserver une visite
            </h3>
            {visitSent ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-slate-900 dark:text-white">Demande envoyée !</p>
                <p className="text-slate-400 text-sm mt-1">Le propriétaire vous contactera bientôt.</p>
              </div>
            ) : (
              <form onSubmit={handleVisitSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Votre nom</label>
                  <input required value={visitName} onChange={(e) => setVisitName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Téléphone</label>
                  <input required type="tel" value={visitPhone} onChange={(e) => setVisitPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Date souhaitée</label>
                  <input required type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900]" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowVisitModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-sm font-semibold text-slate-600 dark:text-slate-300">Annuler</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#E9E900] hover:bg-[#c4c400] text-white text-sm font-bold">Envoyer</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
