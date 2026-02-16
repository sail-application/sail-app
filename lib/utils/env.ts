/**
 * lib/utils/env.ts
 *
 * Environment variable validation using Zod schemas.
 *
 * Two schemas exist:
 *   - serverEnvSchema  → variables only available on the server (API keys, DB URLs)
 *   - clientEnvSchema  → variables exposed to the browser (NEXT_PUBLIC_*)
 *
 * Validation is lazy — it runs only when you call `validateServerEnv()` or
 * `validateClientEnv()`, so builds without env vars (e.g. CI lint-only
 * steps) don't fail at import time.
 */

import { z } from "zod/v4";

/* ── Server-side env schema ── */

/** Schema for server-only environment variables (never shipped to the browser) */
const serverEnvSchema = z.object({
  /* Supabase */
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  /* AI Providers */
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),

  /* Stripe */
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  /* Integrations (optional — features degrade gracefully if missing) */
  ZOHO_CLIENT_ID: z.string().min(1).optional(),
  ZOHO_CLIENT_SECRET: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),

  /* Sentry */
  SENTRY_DSN: z.url().optional(),

  /* App */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/* ── Client-side env schema ── */

/** Schema for NEXT_PUBLIC_* variables available in both server and browser */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
});

/* ── Inferred types ── */

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/* ── Validation functions (called explicitly, not on import) ── */

/**
 * Parse and return validated server environment variables.
 * Throws a descriptive ZodError if any required variable is missing.
 * Call this at server startup or inside API routes — never in client code.
 */
export function validateServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}

/**
 * Parse and return validated client (NEXT_PUBLIC_*) environment variables.
 * Safe to call on both server and client since these values are public.
 */
export function validateClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
}
