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
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" },
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
    qualities: [50, 65, 75, 78, 80, 82, 88, 90],
    minimumCacheTTL: 604800,
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
