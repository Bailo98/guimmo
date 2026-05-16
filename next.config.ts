import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  compress: true,
  poweredByHeader: false,
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
