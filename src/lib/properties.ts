"use client";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import type { Property } from "@/types";

export async function fetchProperties(): Promise<Property[]> {
  if (!isSupabaseConfigured || !supabase) return MOCK_PROPERTIES;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("status", "active")
    .not("title", "is", null)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return MOCK_PROPERTIES;

  return (data as Property[]).filter((p) => p.title && p.title.trim().length >= 5);
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

  return data as Property;
}

export async function publishProperty(
  property: {
    title: string; description: string; type: string; transaction_type: string;
    price: number; price_period: string; surface?: number; rooms?: number;
    bathrooms?: number; furnished: boolean; available_now: boolean;
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
      transaction_type: property.transaction_type,
      status: "pending",
      price: property.price,
      price_period: property.price_period,
      surface: property.surface,
      rooms: property.rooms,
      bathrooms: property.bathrooms,
      furnished: property.furnished,
      available_now: property.available_now,
      neighborhood: property.neighborhood,
      city: property.city,
      features: property.features,
    })
    .select("id")
    .single();

  if (error || !prop) return null;

  if (imageUrls.length > 0) {
    await supabase.from("property_images").insert(
      imageUrls.map((url, i) => ({
        property_id: prop.id,
        url,
        is_primary: i === 0,
        sort_order: i,
      }))
    );
  }

  return { id: prop.id };
}
