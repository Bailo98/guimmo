"use client";
import { useAppStore } from "@/lib/store";

const fr = {
  // Navigation
  home: "Accueil",
  listings: "Annonces",
  publish: "Publier",
  favorites: "Favoris",
  account: "Compte",
  messages: "Messages",
  search: "Rechercher",

  // Search / Filters
  searchPlaceholder: "Quartier, type de bien...",
  allTypes: "Tous les types",
  allNeighborhoods: "Tous les quartiers",
  rent: "Location",
  sale: "Vente",
  filter: "Filtrer",
  sortBy: "Trier par",
  newest: "Plus récent",
  priceAsc: "Prix croissant",
  priceDesc: "Prix décroissant",

  // Property
  perMonth: "/mois",
  perYear: "/an",
  total: "total",
  rooms: "pièces",
  room: "pièce",
  bathrooms: "SDB",
  surface: "m²",
  furnished: "Meublé",
  unfurnished: "Non meublé",
  availableNow: "Disponible maintenant",
  seeDetails: "Voir l'annonce",
  contact: "Contacter",
  whatsapp: "WhatsApp",
  share: "Partager",
  save: "Sauvegarder",
  saved: "Sauvegardé",

  // Auth
  login: "Connexion",
  signup: "Inscription",
  logout: "Déconnexion",
  phone: "Téléphone",
  password: "Mot de passe",

  // Common
  loading: "Chargement...",
  noResults: "Aucun résultat",
  seeAll: "Voir tout",
  back: "Retour",
  confirm: "Confirmer",
  cancel: "Annuler",
  save_action: "Enregistrer",
  delete: "Supprimer",
  edit: "Modifier",
  publish_action: "Publier",
  verified: "Vérifié",

  // Homepage
  heroTitle: "L'immobilier guinéen,\nenfin accessible à tous",
  heroSubtitle:
    "Trouvez rapidement un appartement, maison ou studio à Conakry. Annonces vérifiées, propriétaires certifiés.",
  featuredListings: "Annonces en vedette",
  recentListings: "Annonces récentes",

  // Footer
  allRights: "Tous droits réservés",
};

const en = {
  // Navigation
  home: "Home",
  listings: "Listings",
  publish: "Publish",
  favorites: "Favorites",
  account: "Account",
  messages: "Messages",
  search: "Search",

  // Search / Filters
  searchPlaceholder: "Neighborhood, property type...",
  allTypes: "All types",
  allNeighborhoods: "All neighborhoods",
  rent: "Rent",
  sale: "Sale",
  filter: "Filter",
  sortBy: "Sort by",
  newest: "Newest",
  priceAsc: "Price ascending",
  priceDesc: "Price descending",

  // Property
  perMonth: "/month",
  perYear: "/year",
  total: "total",
  rooms: "rooms",
  room: "room",
  bathrooms: "bathrooms",
  surface: "m²",
  furnished: "Furnished",
  unfurnished: "Unfurnished",
  availableNow: "Available now",
  seeDetails: "See listing",
  contact: "Contact",
  whatsapp: "WhatsApp",
  share: "Share",
  save: "Save",
  saved: "Saved",

  // Auth
  login: "Login",
  signup: "Sign up",
  logout: "Logout",
  phone: "Phone",
  password: "Password",

  // Common
  loading: "Loading...",
  noResults: "No results",
  seeAll: "See all",
  back: "Back",
  confirm: "Confirm",
  cancel: "Cancel",
  save_action: "Save",
  delete: "Delete",
  edit: "Edit",
  publish_action: "Publish",
  verified: "Verified",

  // Homepage
  heroTitle: "Guinean real estate,\nfinally accessible to all",
  heroSubtitle:
    "Quickly find an apartment, house or studio in Conakry. Verified listings, certified landlords.",
  featuredListings: "Featured listings",
  recentListings: "Recent listings",

  // Footer
  allRights: "All rights reserved",
};

export type TranslationKey = keyof typeof fr;

export function useT() {
  const lang = useAppStore((s) => s.lang);
  const dict = lang === "en" ? en : fr;
  return (key: TranslationKey) => dict[key] ?? key;
}
