import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/compte/", "/api/"],
    },
    sitemap: "https://LogerBien.gn/sitemap.xml",
  };
}
