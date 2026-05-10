import type { MetadataRoute } from "next";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { POPULAR_NEIGHBORHOODS } from "@/data/neighborhoods";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://guimmo.gn";
  const staticPages = [
    "/",
    "/annonces",
    "/tarifs",
    "/comment-ca-marche",
    "/connexion",
    "/inscription",
    "/cgv",
    "/calculateur",
    "/guide",
  ].map((path) => ({
    url: base + path,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const propertyPages = MOCK_PROPERTIES.map((p) => ({
    url: `${base}/annonces/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const neighborhoodPages = POPULAR_NEIGHBORHOODS.slice(0, 12).map((n) => ({
    url: `${base}/annonces?neighborhood=${n.id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...propertyPages, ...neighborhoodPages];
}
