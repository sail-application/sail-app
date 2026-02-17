/**
 * lib/ai/context-pack-loader.ts
 *
 * Loads a context pack from the database by ID.
 * Context packs inject industry-specific identity and vocabulary overlays
 * into the AI prompt without replacing the active methodology.
 *
 * Returns null if the ID is missing, the pack is inactive, or any error occurs.
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface ContextPackOverlay {
  identity_overlay?: string;
  vocabulary_overlay?: Record<string, string>;
}

/**
 * Fetches a context pack's overlay data from the database.
 *
 * @param contextPackId - UUID of the context pack (or null/undefined to skip)
 * @returns The pack's overlay fields, or null if not found / inactive
 */
export async function loadContextPack(
  contextPackId: string | null | undefined,
): Promise<ContextPackOverlay | null> {
  if (!contextPackId) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('context_packs')
      .select('identity_overlay, vocabulary_overlay')
      .eq('id', contextPackId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return {
      identity_overlay: data.identity_overlay ?? undefined,
      vocabulary_overlay: (data.vocabulary_overlay as Record<string, string>) ?? undefined,
    };
  } catch {
    return null;
  }
}
