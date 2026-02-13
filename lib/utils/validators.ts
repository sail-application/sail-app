/**
 * lib/utils/validators.ts
 *
 * Shared Zod validation schemas used across API routes and server actions.
 * Centralising these avoids duplicating the same parsing logic in every
 * handler and keeps error messages consistent.
 *
 * IMPORTANT: Uses `zod/v4` subpath import — the project has Zod v4 installed.
 */

import { z } from 'zod/v4';

/* ── Primitives ── */

/** Validates a well-formed email address */
export const emailSchema = z.email('Invalid email address');

/** Validates a UUID v4 string (lowercase hex with dashes) */
export const uuidSchema = z.uuid('Invalid UUID');

/* ── Pagination ── */

/**
 * Standard pagination query params with sensible defaults.
 * page  → 1-based page number  (default 1)
 * limit → items per page        (default 20, max 100)
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/* ── AI Chat Request ── */

/** Allowed feature identifiers — matches AiFeature type in types/ai.ts */
const aiFeatureEnum = z.enum([
  'live-call',
  'practice',
  'email',
  'analyzer',
  'strategies',
]);

/** Schema for a single message in an AI chat conversation */
const aiMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty'),
});

/**
 * Validates the body of an AI chat API request.
 * Enforces at least one message and keeps temperature in the 0-2 range.
 */
export const aiChatRequestSchema = z.object({
  messages: z.array(aiMessageSchema).min(1, 'At least one message is required'),
  feature: aiFeatureEnum,
  maxTokens: z.number().int().min(1).max(32_768).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/* ── Inferred Types (handy for server actions / route handlers) ── */

export type PaginationInput = z.infer<typeof paginationSchema>;
export type AiChatRequestInput = z.infer<typeof aiChatRequestSchema>;
