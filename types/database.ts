/**
 * types/database.ts
 *
 * Barrel file that re-exports every Supabase table type and provides the
 * top-level `Database` type used by the Supabase client generic parameter.
 *
 * Split across two modules to stay under the 200-line limit:
 *   - database-core.ts    → auth, roles, profiles, AI config, infra tables
 *   - database-features.ts → email, calls, notes, practice, strategies
 */

/* ── Re-export all individual table types for direct import ── */

export type {
  AuthorizedMember,
  UserRole,
  UserProfile,
  AiFeatureKey,
  AiProviderKey,
  AiProviderConfig,
  TokenUsageLog,
  AuditLog,
  WebhookEvent,
  BackgroundJob,
  FeatureFlag,
  AppSetting,
} from './database-core';

export type {
  EmailConversation,
  CallHistory,
  UserNote,
  PracticeSession,
  Strategy,
} from './database-features';

export type {
  Methodology,
  UserMethodologyPreference,
} from './methodology';

export type {
  MethodologyEvent,
} from './coaching-events';

/* ── Import concrete types needed for the Database wrapper ── */

import type {
  AuthorizedMember,
  UserRole,
  UserProfile,
  AiProviderConfig,
  TokenUsageLog,
  AuditLog,
  WebhookEvent,
  BackgroundJob,
  FeatureFlag,
  AppSetting,
} from './database-core';

import type {
  EmailConversation,
  CallHistory,
  UserNote,
  PracticeSession,
  Strategy,
} from './database-features';

import type { Methodology, UserMethodologyPreference } from './methodology';
import type { MethodologyEvent } from './coaching-events';

/* ── Helper: generates Row / Insert / Update shapes per table ── */

/**
 * Utility that produces the standard shape Supabase expects for each table.
 * Row   = what you get back from a SELECT
 * Insert = what you pass to an INSERT (all fields optional except non-nullable ones)
 * Update = what you pass to an UPDATE (all fields optional)
 */
interface TableDefinition<T> {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
}

/* ── Top-level Database type for `createClient<Database>()` ── */

/**
 * Pass this as the generic to `createClient<Database>()` so the Supabase
 * JS client returns strongly-typed rows for every query.
 *
 * Example:
 *   import { createClient } from '@supabase/supabase-js';
 *   import type { Database } from '@/types/database';
 *   const supabase = createClient<Database>(url, key);
 */
export interface Database {
  public: {
    Tables: {
      authorized_members: TableDefinition<AuthorizedMember>;
      user_roles: TableDefinition<UserRole>;
      user_profiles: TableDefinition<UserProfile>;
      ai_provider_configs: TableDefinition<AiProviderConfig>;
      token_usage_logs: TableDefinition<TokenUsageLog>;
      audit_logs: TableDefinition<AuditLog>;
      webhook_events: TableDefinition<WebhookEvent>;
      background_jobs: TableDefinition<BackgroundJob>;
      feature_flags: TableDefinition<FeatureFlag>;
      app_settings: TableDefinition<AppSetting>;
      email_conversations: TableDefinition<EmailConversation>;
      call_history: TableDefinition<CallHistory>;
      user_notes: TableDefinition<UserNote>;
      practice_sessions: TableDefinition<PracticeSession>;
      strategies: TableDefinition<Strategy>;
      methodologies: TableDefinition<Methodology>;
      user_methodology_preferences: TableDefinition<UserMethodologyPreference>;
      methodology_events: TableDefinition<MethodologyEvent>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
