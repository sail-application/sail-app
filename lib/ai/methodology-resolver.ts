/**
 * lib/ai/methodology-resolver.ts
 *
 * Resolves the active methodology for a user. Fetches the user's primary
 * methodology from `user_methodology_preferences` and loads the full
 * methodology row (including AI coaching content) from `methodologies`.
 *
 * Results are cached per-user for 5 minutes to avoid excessive DB queries
 * (same TTL pattern as provider config cache in provider.ts).
 *
 * Falls back to the first active methodology by sort_order if the user
 * hasn't selected one yet.
 */

import type { Methodology } from '@/types/methodology';

/* ──────────────── Cache ──────────────── */

interface CachedMethodology {
  methodology: Methodology | null;
  cachedAt: number;
}

const methodologyCache = new Map<string, CachedMethodology>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/* ──────────────── Public API ──────────────── */

/**
 * Resolves the active methodology for a given user.
 * Checks user's primary preference first, falls back to default.
 *
 * @param userId - The authenticated user's ID
 * @param methodologyId - Optional override (e.g., from request body)
 * @returns The full methodology row, or null if none found
 */
export async function resolveMethodology(
  userId: string,
  methodologyId?: string,
): Promise<Methodology | null> {
  // If a specific methodology was requested, load it directly
  if (methodologyId) {
    return loadMethodologyById(methodologyId);
  }

  // Check cache for user's resolved methodology
  const cacheKey = `user:${userId}`;
  const cached = methodologyCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.methodology;
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();

    // Look up user's primary methodology preference
    const { data: pref } = await supabase
      .from('user_methodology_preferences')
      .select('methodology_id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();

    let methodology: Methodology | null = null;

    if (pref?.methodology_id) {
      methodology = await loadMethodologyById(pref.methodology_id);
    }

    // Fallback: first active methodology by sort_order
    if (!methodology) {
      const { data: fallback } = await supabase
        .from('methodologies')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      methodology = (fallback as Methodology) ?? null;
    }

    methodologyCache.set(cacheKey, { methodology, cachedAt: now });
    return methodology;
  } catch (err) {
    console.error('[MethodologyResolver] Failed to resolve:', err);
    return null;
  }
}

/**
 * Loads a single methodology by ID. Used for direct overrides.
 */
async function loadMethodologyById(id: string): Promise<Methodology | null> {
  const cacheKey = `id:${id}`;
  const cached = methodologyCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.methodology;
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('methodologies')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    const methodology = data as Methodology;
    methodologyCache.set(cacheKey, { methodology, cachedAt: now });
    return methodology;
  } catch {
    return null;
  }
}

/** Clears the methodology cache (e.g., after admin edits). */
export function clearMethodologyCache(): void {
  methodologyCache.clear();
}
