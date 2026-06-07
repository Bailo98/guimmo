import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "X-DNS-Prefetch-Control",    value: "on" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: SECURITY_HEADERS },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
    formats: ["image/webp", "image/avif"],
    qualities: [65, 75, 90],
    minimumCacheTTL: 86400,
    deviceSizes: [375, 414, 640, 768, 1024, 1280],
    imageSizes: [16, 32, 64, 96, 128, 256],
  },
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@supabase/supabase-js",
    ],
  },
};

export default nextConfig;
