/**
 * next.config.ts — Next.js configuration for SAIL.
 * - standalone output: enables Docker containerization
 * - image remotePatterns: allows Supabase storage and Google avatar images
 * - serverActions bodySizeLimit: supports file uploads for Call Analyzer
 * - Sentry: error tracking, source maps, session replay, ad-blocker bypass
 */
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org/project (from wizard setup)
  org: "sail-cq",
  project: "sail-alert",

  // Upload source maps then delete them — keeps them out of the public bundle
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Proxy Sentry requests through the app — bypasses ad-blockers
  // (critical for sales tool users who often have blockers enabled)
  tunnelRoute: "/monitoring",

  // TODO: Re-enable excludeDebugStatements after Sentry is verified working
  bundleSizeOptimizations: {
    excludeDebugStatements: false,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
  },

  // Silence the build logs locally — only print in CI
  silent: !process.env.CI,
});
