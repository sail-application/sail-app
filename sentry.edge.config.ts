/**
 * sentry.edge.config.ts — Edge runtime Sentry initialization for SAIL.
 *
 * Loaded automatically by the Next.js instrumentation hook (instrumentation.ts)
 * for the edge runtime (middleware, edge API routes). Minimal config since
 * edge has limited API surface compared to Node.js.
 */

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://4637a4b439bee18482a2c260a21b27f1@o4510875821539328.ingest.us.sentry.io/4510892043206656",
  environment: isProd ? "production" : "development",
  tracesSampleRate: isProd ? 0.2 : 1.0,
  sendDefaultPii: false,
});
