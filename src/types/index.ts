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
  owner_id: string;
  title: string;
  description?: string;
  transaction_type: "rent" | "sale";
  type: string;
  status: string;
  price: number;
  price_period?: string;
  surface?: number;
  rooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  available_now?: boolean;
  neighborhood: string;
  city?: string;
  features?: string[];
  contact_phone?: string;
  contact_preference?: string;
  views?: number;
  whatsapp_clicks?: number;
  is_boosted?: boolean;
  is_verified?: boolean;
  boost_expires_at?: string;
  latitude?: number;
  longitude?: number;
  water_source?: string;
  electricity?: string;
  internet?: string;
  has_parking?: boolean;
  has_security?: boolean;
  has_fence?: boolean;
  floor_number?: number;
  has_ac?: boolean;
  kitchen_equipped?: boolean;
  video_url?: string;
  has_virtual_tour?: boolean;
  ref?: string;
  created_at?: string;
  updated_at?: string;
  property_images?: {
    url: string;
    is_primary: boolean;
    sort_order: number;
  }[];
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
