/**
 * types/database-core.ts
 *
 * Core infrastructure Supabase table types — auth gating, roles, profiles,
 * AI config, token tracking, audit logs, webhooks, jobs, feature flags, and
 * app settings.  Feature-specific table types live in database-features.ts.
 *
 * Every field maps 1-to-1 with the Postgres column it represents so the
 * Supabase client can be generically typed.
 */

/* ───────────────────────── Auth & User Tables ───────────────────────── */

/** Row in `authorized_members` — Skool community gating list */
export interface AuthorizedMember {
  id: string;
  email: string;
  skool_username: string;
  is_active: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Row in `user_roles` — RBAC role assignment */
export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'team_lead' | 'rep';
  assigned_by: string | null;
  created_at: string;
}

/** Row in `user_profiles` — extended profile data (id references auth.users) */
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  onboarding_completed: boolean;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

/* ──────────────────────── AI Configuration ──────────────────────── */

/** Supported AI feature keys — each feature can be wired to a different provider */
export type AiFeatureKey =
  | 'live-call'
  | 'practice'
  | 'email'
  | 'analyzer'
  | 'strategies';

/** Supported AI provider identifiers */
export type AiProviderKey = 'gemini' | 'claude' | 'openai' | 'deepseek';

/** Row in `ai_provider_configs` — per-feature provider/model mapping */
export interface AiProviderConfig {
  id: string;
  feature: AiFeatureKey;
  provider: AiProviderKey;
  model: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Row in `token_usage_logs` — tracks every AI call for cost analysis */
export interface TokenUsageLog {
  id: string;
  user_id: string;
  feature: AiFeatureKey;
  provider: AiProviderKey;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  created_at: string;
}

/* ───────────────── Audit, Webhooks, Jobs, Flags ─────────────────── */

/** Row in `audit_logs` — immutable record of user actions */
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

/** Row in `webhook_events` — inbound webhooks from third-party services */
export interface WebhookEvent {
  id: string;
  source: 'stripe' | 'skool' | 'zoho';
  event_type: string;
  payload: Record<string, unknown>;
  status: 'received' | 'processed' | 'failed';
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

/** Row in `background_jobs` — async task queue backed by pgmq */
export interface BackgroundJob {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/** Row in `feature_flags` — runtime feature toggles */
export interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  is_enabled: boolean;
  metadata: Record<string, unknown>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Row in `app_settings` — key/value config grouped by category */
export interface AppSetting {
  id: string;
  category: string;
  key: string;
  value: unknown;
  label: string | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}
