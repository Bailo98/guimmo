import { notFound } from "next/navigation";
import Link from "next/link";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { TrustBadge } from "@/components/ui/Badge";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { StarRating } from "@/components/ui/StarRating";
import type { Metadata } from "next";
import { Shield, Eye, MessageCircle, Star } from "lucide-react";
import type { User } from "@/types";
import { ReviewsSection } from "./ReviewsSection";

interface Props {
  params: Promise<{ id: string }>;
}

const MOCK_OWNERS: User[] = [
  { id: "user-001", name: "Mamadou Diallo", email: "", phone: "+224620000001", role: "owner", verified: true, badges: [], createdAt: new Date(), trustScore: 85 },
  { id: "user-002", name: "Fatoumata Bah", email: "", phone: "+224628000002", role: "owner", verified: false, badges: [], createdAt: new Date(), trustScore: 70 },
  { id: "user-003", name: "Ibrahim Camara", email: "", phone: "+224622000003", role: "owner", verified: false, badges: [], createdAt: new Date(), trustScore: 60 },
  { id: "user-004", name: "Aissatou Sow", email: "", phone: "+224624000004", role: "agent", verified: true, badges: [], createdAt: new Date(), trustScore: 90 },
  { id: "user-005", name: "Oumar Barry", email: "", phone: "+224626000005", role: "owner", verified: false, badges: [], createdAt: new Date(), trustScore: 65 },
];

function getUniqueOwners(): User[] {
  const ownerIds = [...new Set(MOCK_PROPERTIES.map((p) => p.owner_id))];
  return ownerIds.map((id) => MOCK_OWNERS.find((o) => o.id === id)).filter(Boolean) as User[];
}

export async function generateStaticParams() {
  return getUniqueOwners().map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const owner = MOCK_OWNERS.find((o) => o.id === id);
  if (!owner) return { title: "Propriétaire introuvable" };
  return {
    title: `${owner.name} — BienLoger`,
    description: `Profil de ${owner.name} sur BienLoger. Découvrez ses annonces immobilières en Guinée.`,
  };
}

const ROLE_LABELS: Record<string, string> = {
  agent: "Agent immobilier",
  agency: "Agence immobilière",
  owner: "Propriétaire",
  user: "Utilisateur",
  admin: "Administrateur",
};

export default async function ProprietaireProfilePage({ params }: Props) {
  const { id } = await params;
  const owner = MOCK_OWNERS.find((o) => o.id === id);
  if (!owner) notFound();

  const ownerProperties = MOCK_PROPERTIES.filter((p) => p.owner_id === id);
  const totalViews = ownerProperties.reduce((sum, p) => sum + (p.views ?? 0), 0);
  const totalWhatsapp = ownerProperties.reduce((sum, p) => sum + (p.whatsapp_clicks ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16 pt-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-[#E9E900]">Accueil</Link>
        <span>/</span>
        <Link href="/annonces" className="hover:text-[#E9E900]">Annonces</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">{owner.name}</span>
      </nav>

      {/* Profile Header */}
      <div className="bg-[#2c2f36] rounded-2xl p-6 border border-[#1e2a30] mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-3xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #E9E900, #c4c400)" }}
          >
            {owner.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{owner.name}</h1>
              {owner.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-yellow-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> Vérifié
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{ROLE_LABELS[owner.role] ?? owner.role}</p>

            {/* Trust score */}
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Score de confiance</span>
                <span className="text-xs font-bold text-[#E9E900]">{owner.trustScore}%</span>
              </div>
              <div className="w-full max-w-xs bg-slate-100 dark:bg-[#151922] rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${owner.trustScore}%`, background: "linear-gradient(90deg, #E9E900, #c4c400)" }}
                />
              </div>
            </div>

            {/* Star rating from owner type or reviews — shown via ReviewsSection */}
            {owner.avgRating ? (
              <div className="mt-2">
                <StarRating rating={owner.avgRating} count={owner.reviewCount} size="md" />
              </div>
            ) : null}

            {/* Response rate */}
            {owner.responseRate && (
              <p className="text-green-500 dark:text-yellow-400 text-sm font-medium mt-2">
                {owner.responseRate}% taux de réponse
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        {owner.badges.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-[#2a3040]">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Badges</p>
            <div className="flex flex-wrap gap-2">
              {owner.badges.map((b) => (
                <TrustBadge key={b.id} badge={b} size="md" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Annonces", value: ownerProperties.length },
          { label: "Vues totales", value: totalViews, icon: <Eye className="w-4 h-4" /> },
          { label: "Contacts WhatsApp", value: totalWhatsapp, icon: <MessageCircle className="w-4 h-4" /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#2c2f36] rounded-2xl p-4 border border-[#1e2a30] text-center"
          >
            <p className="text-2xl font-black text-[#E9E900]">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
              {stat.icon}
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Properties */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Annonces de {owner.name}
        </h2>
        {ownerProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ownerProperties.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Aucune annonce pour ce propriétaire.</p>
        )}
      </div>

      {/* Reviews — client component for store access and form */}
      <ReviewsSection ownerId={id} ownerName={owner.name} />
    </div>
  );
}
