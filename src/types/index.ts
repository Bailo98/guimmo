export type UserRole = "user" | "owner" | "agent" | "agency" | "admin";

export type PropertyType =
  | "apartment"
  | "house"
  | "studio"
  | "villa"
  | "office"
  | "shop"
  | "land"
  | "room";

export type PropertyStatus = "active" | "rented" | "sold" | "pending" | "suspended";

export type TransactionType = "rent" | "sale";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  avatar?: string;
  role: UserRole;
  verified: boolean;
  badges: Badge[];
  createdAt: Date;
  trustScore: number;
  responseRate?: number;
  totalListings?: number;
  avgRating?: number;
  reviewCount?: number;
}

export interface Badge {
  id: string;
  type:
    | "phone_verified"
    | "listing_verified"
    | "owner_verified"
    | "agency_verified"
    | "real_photos"
    | "quick_response"
    | "top_agent"
    | "visit_confirmed"
    | "verified_onsite";
  label: string;
  color: "green" | "orange" | "blue" | "purple" | "gold";
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  transactionType: TransactionType;
  status: PropertyStatus;
  price: number;
  pricePeriod?: "month" | "year" | "total";
  surface?: number;
  rooms?: number;
  bathrooms?: number;
  furnished: boolean;
  availableNow: boolean;
  neighborhood: string;
  city: string;
  address?: string;
  images: PropertyImage[];
  owner: User;
  badges: Badge[];
  views: number;
  whatsappClicks: number;
  isBoosted: boolean;
  boostExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  features: string[];
  virtualTourUrl?: string;
  videoUrl?: string;
  shortRef?: string;
  latitude?: number;
  longitude?: number;
  waterSource?: "robinet" | "forage" | "citerne" | "none";
  electricity?: "edg" | "solaire" | "groupe" | "none";
  internet?: "wifi" | "none";
  hasParking?: boolean;
  hasSecurity?: boolean;
  hasFence?: boolean;
  floorNumber?: number;
  hasAc?: boolean;
  kitchenEquipped?: boolean;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface SearchFilters {
  query?: string;
  neighborhood?: string;
  type?: PropertyType;
  transactionType?: TransactionType;
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  furnished?: boolean;
  availableNow?: boolean;
  sortBy?: "recent" | "price_asc" | "price_desc" | "popular";
}

export interface Subscription {
  id: string;
  userId: string;
  plan: "agent" | "agency";
  status: "active" | "expired" | "cancelled";
  priceGNF: number;
  startDate: Date;
  endDate: Date;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: "GNF";
  method: "orange_money" | "mtn_money" | "visa" | "mastercard";
  status: "pending" | "success" | "failed" | "expired";
  description: string;
  reference: string;
  createdAt: Date;
}
