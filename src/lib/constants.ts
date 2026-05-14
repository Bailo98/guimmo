export const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "studio", label: "Studio" },
  { value: "villa", label: "Villa" },
  { value: "room", label: "Chambre" },
  { value: "office", label: "Bureau" },
  { value: "shop", label: "Boutique" },
  { value: "land", label: "Terrain" },
] as const;

export const TRANSACTION_TYPES = [
  { value: "rent", label: "Location" },
  { value: "sale", label: "Vente" },
] as const;

export const PRICE_RANGES_RENT = [
  { label: "Moins de 1M GNF", min: 0, max: 1_000_000 },
  { label: "1M - 3M GNF", min: 1_000_000, max: 3_000_000 },
  { label: "3M - 5M GNF", min: 3_000_000, max: 5_000_000 },
  { label: "5M - 10M GNF", min: 5_000_000, max: 10_000_000 },
  { label: "Plus de 10M GNF", min: 10_000_000, max: undefined },
] as const;

export const FREE_LISTINGS_LIMIT = 3;

export const PLANS = {
  listing_extra: { price: 30_000, label: "Annonce supplémentaire", duration: null },
  boost_7: { price: 50_000, label: "Boost 7 jours", duration: 7 },
  boost_30: { price: 150_000, label: "Boost 30 jours", duration: 30 },
  agent_monthly: { price: 200_000, label: "Abonnement Agent / mois", duration: 30 },
  agency_monthly: { price: 750_000, label: "Abonnement Agence / mois", duration: 30 },
} as const;

export const BADGE_CONFIG = {
  phone_verified: { label: "Numéro vérifié", color: "green", icon: "check-circle" },
  listing_verified: { label: "Annonce vérifiée", color: "green", icon: "shield-check" },
  owner_verified: { label: "Propriétaire vérifié", color: "blue", icon: "user-check" },
  agency_verified: { label: "Agence vérifiée", color: "purple", icon: "building" },
  real_photos: { label: "Photos réelles", color: "blue", icon: "camera" },
  quick_response: { label: "Réponse rapide", color: "green", icon: "zap" },
  top_agent: { label: "Top Agent", color: "orange", icon: "star" },
  visit_confirmed: { label: "Visite confirmée", color: "green", icon: "map-pin" },
} as const;

export const SITE_NAME = "BienLoger";
export const SITE_TAGLINE = "L'immobilier guinéen simplifié";
export const SITE_DESCRIPTION = "BienLoger est la plateforme immobilière de confiance en Guinée. Trouvez rapidement un appartement, une maison ou un studio à Conakry et partout en Guinée.";
export const WHATSAPP_DEFAULT_MESSAGE = "Bonjour, je viens de BienLoger. Je suis intéressé(e) par votre annonce. Est-elle toujours disponible ?";
