import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { POPULAR_NEIGHBORHOODS } from "@/data/neighborhoods";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://BienLoger.gn";

const STATIC_PAGES = [
  "/", "/annonces", "/tarifs", "/comment-ca-marche",
  "/connexion", "/inscription", "/cgv", "/calculateur", "/guide", "/a-propos",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = STATIC_PAGES.map((path) => ({
    url: SITE_URL + path,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const neighborhoodPages = POPULAR_NEIGHBORHOODS.slice(0, 12).map((n) => ({
    url: `${SITE_URL}/annonces?neighborhood=${n.id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Fetch live property IDs from Supabase when configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let propertyPages: MetadataRoute.Sitemap = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey);
      const { data } = await client
        .from("properties")
        .select("id, updated_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(500);

      if (data) {
        propertyPages = data.map((p) => ({
          url: `${SITE_URL}/annonces/${p.id}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: "daily" as const,
          priority: 0.9,
        }));
      }
    } catch {
      // Sitemap generation continues without property pages on error
    }
  }

  return [...staticPages, ...propertyPages, ...neighborhoodPages];
}
