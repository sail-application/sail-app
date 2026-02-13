/**
 * next.config.ts — Next.js configuration for SAIL.
 * - standalone output: enables Docker containerization
 * - image remotePatterns: allows Supabase storage and Google avatar images
 * - serverActions bodySizeLimit: supports file uploads for Call Analyzer
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
