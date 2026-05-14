"use client";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import type { Property } from "@/types";

// Maps Supabase snake_case row to our Property type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Property {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    type: row.type,
    transactionType: row.transaction_type,
    status: row.status ?? "active",
    price: row.price,
    pricePeriod: row.price_period ?? "month",
    surface: row.surface,
    rooms: row.rooms,
    bathrooms: row.bathrooms,
    furnished: row.furnished ?? false,
    availableNow: row.available_now ?? true,
    neighborhood: row.neighborhood,
    city: row.city ?? "Conakry",
    features: row.features ?? [],
    images: (row.property_images ?? []).map((img: { id: string; url: string; alt: string; is_primary: boolean }) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? "",
      isPrimary: img.is_primary ?? false,
    })),
    owner: {
      id: row.profiles?.id ?? row.owner_id,
      name: row.profiles?.name ?? "Propriétaire",
      email: "",
      phone: row.profiles?.phone ?? "",
      whatsapp: row.profiles?.whatsapp ?? row.profiles?.phone ?? "",
      role: row.profiles?.role ?? "owner",
      verified: row.profiles?.verified ?? false,
      badges: [],
      trustScore: row.profiles?.trust_score ?? 50,
      totalListings: row.profiles?.total_listings ?? 1,
      avgRating: 4.5,
      reviewCount: 0,
      createdAt: new Date(row.profiles?.created_at ?? Date.now()),
    },
    badges: [],
    views: row.views ?? 0,
    whatsappClicks: row.whatsapp_clicks ?? 0,
    isBoosted: row.is_boosted ?? false,
    boostExpiresAt: row.boost_expires_at ? new Date(row.boost_expires_at) : undefined,
    createdAt: new Date(row.created_at ?? Date.now()),
    updatedAt: new Date(row.updated_at ?? Date.now()),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    videoUrl: row.video_url ?? undefined,
    shortRef: row.short_ref ?? undefined,
  };
}

export async function fetchProperties(): Promise<Property[]> {
  if (!isSupabaseConfigured || !supabase) return MOCK_PROPERTIES;

  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return MOCK_PROPERTIES;

  return data.map(mapRow);
}

export async function fetchPropertyById(id: string): Promise<Property | undefined> {
  if (!isSupabaseConfigured || !supabase) {
    return MOCK_PROPERTIES.find((p) => p.id === id);
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", id)
    .single();

  if (error || !data) return MOCK_PROPERTIES.find((p) => p.id === id);

  return mapRow(data);
}

export async function publishProperty(
  property: {
    title: string; description: string; type: string; transactionType: string;
    price: number; pricePeriod: string; surface?: number; rooms?: number;
    bathrooms?: number; furnished: boolean; availableNow: boolean;
    neighborhood: string; city: string; features: string[];
  },
  imageUrls: string[]
): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prop, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      title: property.title,
      description: property.description,
      type: property.type,
      transaction_type: property.transactionType,
      status: "pending",
      price: property.price,
      price_period: property.pricePeriod,
      surface: property.surface,
      rooms: property.rooms,
      bathrooms: property.bathrooms,
      furnished: property.furnished,
      available_now: property.availableNow,
      neighborhood: property.neighborhood,
      city: property.city,
      features: property.features,
    })
    .select("id")
    .single();

  if (error || !prop) return null;

  // Insert images if any
  if (imageUrls.length > 0) {
    await supabase.from("property_images").insert(
      imageUrls.map((url, i) => ({
        property_id: prop.id,
        url,
        alt: property.title,
        is_primary: i === 0,
      }))
    );
  }

  return { id: prop.id };
}
